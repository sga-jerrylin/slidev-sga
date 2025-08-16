import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import fs from 'fs-extra'
import { config } from './config.js'
import { logger, createRequestLogger } from './logger.js'
import { 
  errorHandler, 
  notFoundHandler, 
  setupProcessErrorHandlers,
  TooManyRequestsError 
} from './error-handler.js'
import {
  validateContentType,
  validateSecurityHeaders
} from './validation.js'
import { presentationManager } from './presentation-manager.js'
import routes from './routes.js'

export class ApiServer {
  private app: express.Application
  private server?: any
  private rateLimiter: RateLimiterMemory

  constructor() {
    this.app = express()
    this.rateLimiter = new RateLimiterMemory({
      keyGenerator: (req) => req.ip,
      points: config.rateLimit.max,
      duration: config.rateLimit.windowMs / 1000, // Convert to seconds
    })
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1)

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false // Allow embedding in iframes
    }))

    // CORS configuration
    if (config.enableCors) {
      this.app.use(cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, etc.)
          if (!origin) return callback(null, true)
          
          // Allow localhost and development origins
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true)
          }
          
          // Add your production domains here
          const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
          if (allowedOrigins.includes(origin)) {
            return callback(null, true)
          }
          
          callback(new Error('Not allowed by CORS'))
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      }))
    }

    // Compression
    if (config.enableCompression) {
      this.app.use(compression())
    }

    // Rate limiting
    this.app.use(async (req, res, next) => {
      try {
        await this.rateLimiter.consume(req.ip)
        next()
      } catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
        res.set('Retry-After', String(secs))
        
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url
        })
        
        next(new TooManyRequestsError('Too many requests, please try again later'))
      }
    })

    // Request logging
    this.app.use(createRequestLogger())

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true
    }))
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }))

    // Custom validation middleware
    this.app.use(validateContentType)
    this.app.use(validateSecurityHeaders)
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint (before rate limiting for monitoring)
    this.app.get('/ping', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      })
    })

    // API routes
    this.app.use('/api', routes)

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Slidev API Server',
        version: process.env.npm_package_version || '1.0.0',
        description: 'API server for dynamic Slidev presentation generation',
        endpoints: {
          health: '/api/health',
          presentations: '/api/presentations',
          stats: '/api/stats',
          docs: '/api/docs'
        },
        timestamp: new Date().toISOString()
      })
    })

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Slidev API Documentation',
        version: '1.0.0',
        endpoints: [
          {
            method: 'POST',
            path: '/api/presentations',
            description: 'Create a new presentation from markdown content',
            body: {
              content: 'string (required) - Markdown content',
              title: 'string (optional) - Presentation title',
              theme: 'string (optional) - Theme name',
              config: 'object (optional) - Slidev configuration',
              ttl: 'number (optional) - Time to live in milliseconds',
              customCSS: 'string (optional) - Custom CSS styles',
              frontmatter: 'object (optional) - Additional frontmatter'
            }
          },
          {
            method: 'GET',
            path: '/api/presentations',
            description: 'List all active presentations'
          },
          {
            method: 'GET',
            path: '/api/presentations/:id',
            description: 'Get specific presentation details'
          },
          {
            method: 'DELETE',
            path: '/api/presentations/:id',
            description: 'Delete a specific presentation'
          },
          {
            method: 'POST',
            path: '/api/presentations/:id/extend',
            description: 'Extend the TTL of a presentation',
            body: {
              ttl: 'number (required) - New TTL in milliseconds'
            }
          },
          {
            method: 'GET',
            path: '/api/health',
            description: 'Get health status'
          },
          {
            method: 'GET',
            path: '/api/stats',
            description: 'Get service statistics'
          },
          {
            method: 'POST',
            path: '/api/cleanup',
            description: 'Manually trigger cleanup of expired presentations'
          }
        ]
      })
    })
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler)

    // Global error handler
    this.app.use(errorHandler)
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Ensure temp directory exists
      await fs.ensureDir(config.tempDir)
      
      // Setup process error handlers
      setupProcessErrorHandlers()

      // Start HTTP server
      this.server = this.app.listen(config.port, config.host, () => {
        logger.info('Slidev API Server started', {
          port: config.port,
          host: config.host,
          tempDir: config.tempDir,
          maxConcurrentPresentations: config.maxConcurrentPresentations,
          portRange: config.portRange,
          environment: process.env.NODE_ENV || 'development'
        })
      })

      // Handle server errors
      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${config.port} is already in use`)
          process.exit(1)
        } else {
          logger.error('Server error', { error })
          process.exit(1)
        }
      })

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown())
      process.on('SIGINT', () => this.shutdown())

    } catch (error) {
      logger.error('Failed to start server', { error })
      process.exit(1)
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down server...')

    try {
      // Stop accepting new connections
      if (this.server) {
        this.server.close()
      }

      // Cleanup presentations
      await presentationManager.shutdown()

      logger.info('Server shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown', { error })
      process.exit(1)
    }
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app
  }
}

// Create and export server instance
export const apiServer = new ApiServer()

// Start server if this file is run directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   apiServer.start()
// }
