import Joi from 'joi'
import type { Request, Response, NextFunction } from 'express'
import { logger } from './logger.js'
import type { GeneratePPTRequest } from './types.js'

// Validation schemas
export const generatePPTSchema = Joi.object({
  content: Joi.string()
    .required()
    .min(1)
    .max(1000000) // 1MB max content
    .messages({
      'string.empty': 'Content cannot be empty',
      'string.max': 'Content is too large (max 1MB)',
      'any.required': 'Content is required'
    }),
    
  title: Joi.string()
    .optional()
    .max(200)
    .messages({
      'string.max': 'Title is too long (max 200 characters)'
    }),
    
  theme: Joi.string()
    .optional()
    .pattern(/^[a-zA-Z0-9-_]+$/)
    .max(50)
    .messages({
      'string.pattern.base': 'Theme name can only contain letters, numbers, hyphens, and underscores',
      'string.max': 'Theme name is too long (max 50 characters)'
    }),
    
  config: Joi.object()
    .optional()
    .unknown(true), // Allow any config properties
    
  ttl: Joi.number()
    .optional()
    .min(60000) // Minimum 1 minute
    .max(86400000) // Maximum 24 hours
    .messages({
      'number.min': 'TTL must be at least 60000ms (1 minute)',
      'number.max': 'TTL cannot exceed 86400000ms (24 hours)'
    }),
    
  customCSS: Joi.string()
    .optional()
    .max(100000) // 100KB max CSS
    .messages({
      'string.max': 'Custom CSS is too large (max 100KB)'
    }),
    
  frontmatter: Joi.object()
    .optional()
    .unknown(true)
})

export const presentationIdSchema = Joi.string()
  .pattern(/^slidev-[a-zA-Z0-9_-]{12}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid presentation ID format',
    'any.required': 'Presentation ID is required'
  })

// Validation middleware factory
export function validateBody<T>(schema: Joi.ObjectSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      logger.warn('Request validation failed', {
        requestId: req.requestId,
        url: req.url,
        errors
      })

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        details: errors
      })
    }

    // Replace req.body with validated and sanitized data
    req.body = value
    next()
  }
}

export function validateParams<T>(schema: Joi.ObjectSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      logger.warn('Parameter validation failed', {
        requestId: req.requestId,
        url: req.url,
        errors
      })

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Parameter validation failed',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        details: errors
      })
    }

    req.params = value
    next()
  }
}

// Content sanitization
export function sanitizeMarkdown(content: string): string {
  // Basic sanitization - remove potentially dangerous content
  // This is a simple implementation, you might want to use a proper markdown sanitizer
  return content
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

// Rate limiting validation
export function validateRateLimit(req: Request, res: Response, next: NextFunction) {
  // This will be handled by rate-limiter-flexible middleware
  // This is just a placeholder for additional custom rate limiting logic
  next()
}

// Content type validation
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type')
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
        code: 'UNSUPPORTED_MEDIA_TYPE',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      })
    }
  }
  next()
}

// Security headers validation
export function validateSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  next()
}

// Custom validation for presentation requests
export function validatePresentationRequest(req: Request, res: Response, next: NextFunction) {
  const body = req.body as GeneratePPTRequest
  
  // Additional business logic validation
  if (body.content) {
    // Check for minimum content requirements
    const trimmedContent = body.content.trim()
    if (trimmedContent.length < 10) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Content is too short (minimum 10 characters)',
        code: 'CONTENT_TOO_SHORT',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      })
    }
    
    // Sanitize markdown content
    body.content = sanitizeMarkdown(body.content)
  }
  
  next()
}
