import type { Request, Response, NextFunction } from 'express'
import { logger } from './logger.js'
import type { ApiError } from './types.js'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}

export class InsufficientResourcesError extends AppError {
  constructor(message: string = 'Insufficient resources') {
    super(message, 507, 'INSUFFICIENT_RESOURCES')
  }
}

// Error handler middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error)
  }

  const requestId = req.requestId || 'unknown'
  
  // Log the error
  logger.error('Request error', {
    requestId,
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // Handle operational errors
  if (error instanceof AppError) {
    const apiError: ApiError = {
      error: error.constructor.name,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      requestId
    }

    res.status(error.statusCode).json(apiError)
    return
  }

  // Handle specific error types
  if (error.name === 'SyntaxError' && 'body' in error) {
    const apiError: ApiError = {
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
      requestId
    }

    res.status(400).json(apiError)
    return
  }

  // Handle EADDRINUSE (port already in use)
  if ('code' in error && error.code === 'EADDRINUSE') {
    const apiError: ApiError = {
      error: 'Port In Use',
      message: 'The requested port is already in use',
      code: 'PORT_IN_USE',
      timestamp: new Date().toISOString(),
      requestId
    }

    res.status(503).json(apiError)
    return
  }

  // Handle ENOENT (file not found)
  if ('code' in error && error.code === 'ENOENT') {
    const apiError: ApiError = {
      error: 'File Not Found',
      message: 'Required file or directory not found',
      code: 'FILE_NOT_FOUND',
      timestamp: new Date().toISOString(),
      requestId
    }

    res.status(500).json(apiError)
    return
  }

  // Handle ENOSPC (no space left on device)
  if ('code' in error && error.code === 'ENOSPC') {
    const apiError: ApiError = {
      error: 'Insufficient Storage',
      message: 'No space left on device',
      code: 'INSUFFICIENT_STORAGE',
      timestamp: new Date().toISOString(),
      requestId
    }

    res.status(507).json(apiError)
    return
  }

  // Default error response for unexpected errors
  const apiError: ApiError = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId
  }

  res.status(500).json(apiError)
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  const apiError: ApiError = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    requestId: req.requestId || 'unknown'
  }

  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  res.status(404).json(apiError)
}

// Async error wrapper
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Process error handlers
export function setupProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
    process.exit(1)
  })

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', { reason, promise })
    process.exit(1)
  })

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
    process.exit(0)
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully')
    process.exit(0)
  })
}
