import { Router } from 'express'
import Joi from 'joi'
import { logger } from './logger.js'
import { presentationManager } from './presentation-manager.js'
import { healthMonitor } from './health.js'
import { portManager } from './port-manager.js'
import {
  validateBody,
  validateParams,
  validatePresentationRequest,
  generatePPTSchema,
  presentationIdSchema
} from './validation.js'
import {
  asyncHandler,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  InsufficientResourcesError
} from './error-handler.js'
import type { GeneratePPTRequest, ListPresentationsResponse } from './types.js'

const router = Router()

/**
 * POST /api/presentations
 * Generate a new presentation from markdown content
 */
router.post('/presentations',
  validateBody(generatePPTSchema),
  validatePresentationRequest,
  asyncHandler(async (req, res) => {
    const request = req.body as GeneratePPTRequest
    
    logger.info('Creating new presentation', {
      requestId: req.requestId,
      title: request.title,
      theme: request.theme,
      contentLength: request.content.length
    })

    // Check if we have available resources
    const health = await healthMonitor.getHealthStatus()
    if (health.status === 'unhealthy') {
      throw new ServiceUnavailableError('Service is currently unhealthy')
    }

    if (health.availablePorts === 0) {
      throw new InsufficientResourcesError('No available ports for new presentations')
    }

    // Create the presentation
    const response = await presentationManager.createPresentation(request)
    
    logger.info('Presentation created successfully', {
      requestId: req.requestId,
      presentationId: response.id,
      url: response.url
    })

    res.status(201).json(response)
  })
)

/**
 * GET /api/presentations
 * List all active presentations
 */
router.get('/presentations',
  asyncHandler(async (req, res) => {
    const presentations = presentationManager.getAllPresentations()
    
    const response: ListPresentationsResponse = {
      presentations: presentations.map(p => ({
        id: p.id,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        expiresAt: p.expiresAt.toISOString(),
        url: `${req.protocol}://${req.get('host')}/api/presentations/${p.id}`,
        title: p.request.title
      })),
      total: presentations.length,
      active: presentations.filter(p => p.status === 'ready').length
    }

    logger.info('Listed presentations', {
      requestId: req.requestId,
      total: response.total,
      active: response.active
    })

    res.json(response)
  })
)

/**
 * GET /api/presentations/:id
 * Get specific presentation details
 */
router.get('/presentations/:id',
  validateParams(Joi.object({ id: presentationIdSchema })),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const presentation = presentationManager.getPresentation(id)
    
    if (!presentation) {
      throw new NotFoundError(`Presentation with ID ${id} not found`)
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`
    const response = {
      id: presentation.id,
      status: presentation.status,
      createdAt: presentation.createdAt.toISOString(),
      expiresAt: presentation.expiresAt.toISOString(),
      error: presentation.error,
      urls: {
        presentation: `${baseUrl}:${presentation.port}/1`,
        presenter: `${baseUrl}:${presentation.port}/presenter/1`,
        overview: `${baseUrl}:${presentation.port}/overview`,
        print: `${baseUrl}:${presentation.port}/print`
      },
      request: {
        title: presentation.request.title,
        theme: presentation.request.theme,
        contentLength: presentation.request.content.length
      }
    }

    logger.info('Retrieved presentation details', {
      requestId: req.requestId,
      presentationId: id,
      status: presentation.status
    })

    res.json(response)
  })
)

/**
 * DELETE /api/presentations/:id
 * Delete a specific presentation
 */
router.delete('/presentations/:id',
  validateParams(Joi.object({ id: presentationIdSchema })),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const deleted = await presentationManager.deletePresentation(id)
    
    if (!deleted) {
      throw new NotFoundError(`Presentation with ID ${id} not found`)
    }

    logger.info('Presentation deleted', {
      requestId: req.requestId,
      presentationId: id
    })

    res.status(204).send()
  })
)

/**
 * POST /api/presentations/:id/extend
 * Extend the TTL of a presentation
 */
router.post('/presentations/:id/extend',
  validateParams(Joi.object({ id: presentationIdSchema })),
  validateBody(Joi.object({
    ttl: Joi.number().min(60000).max(86400000).required()
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { ttl } = req.body
    
    const presentation = presentationManager.getPresentation(id)
    if (!presentation) {
      throw new NotFoundError(`Presentation with ID ${id} not found`)
    }

    // Extend the expiration time
    presentation.expiresAt = new Date(Date.now() + ttl)

    logger.info('Presentation TTL extended', {
      requestId: req.requestId,
      presentationId: id,
      newExpiresAt: presentation.expiresAt.toISOString()
    })

    res.json({
      id: presentation.id,
      expiresAt: presentation.expiresAt.toISOString(),
      message: 'TTL extended successfully'
    })
  })
)

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health',
  asyncHandler(async (req, res) => {
    const health = await healthMonitor.getHealthStatus()
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)
  })
)

/**
 * GET /api/health/ready
 * Readiness check endpoint
 */
router.get('/health/ready',
  asyncHandler(async (req, res) => {
    const ready = await healthMonitor.isReady()
    
    if (ready) {
      res.json({ status: 'ready', timestamp: new Date().toISOString() })
    } else {
      res.status(503).json({ status: 'not ready', timestamp: new Date().toISOString() })
    }
  })
)

/**
 * GET /api/health/live
 * Liveness check endpoint
 */
router.get('/health/live',
  asyncHandler(async (req, res) => {
    const alive = healthMonitor.isAlive()
    
    res.json({ status: alive ? 'alive' : 'dead', timestamp: new Date().toISOString() })
  })
)

/**
 * GET /api/stats
 * Get service statistics
 */
router.get('/stats',
  asyncHandler(async (req, res) => {
    const stats = healthMonitor.getServiceStats()
    const systemInfo = healthMonitor.getSystemInfo()
    
    res.json({
      service: stats,
      system: systemInfo,
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * POST /api/cleanup
 * Manually trigger cleanup of expired presentations
 */
router.post('/cleanup',
  asyncHandler(async (req, res) => {
    logger.info('Manual cleanup triggered', { requestId: req.requestId })
    
    const cleanedCount = await presentationManager.cleanupExpired()
    
    res.json({
      message: 'Cleanup completed',
      cleanedCount,
      timestamp: new Date().toISOString()
    })
  })
)

export default router
