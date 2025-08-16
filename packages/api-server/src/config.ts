import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { ServerConfig } from './types.js'

export function createDefaultConfig(): ServerConfig {
  return {
    port: parseInt(process.env.API_PORT || '3001'),
    host: process.env.API_HOST || '0.0.0.0',
    baseUrl: process.env.BASE_URL || 'http://localhost',
    tempDir: process.env.TEMP_DIR || join(tmpdir(), 'slidev-api'),
    maxConcurrentPresentations: parseInt(process.env.MAX_CONCURRENT || '10'),
    defaultTTL: parseInt(process.env.DEFAULT_TTL || '3600000'), // 1 hour
    portRange: {
      start: parseInt(process.env.PORT_RANGE_START || '3002'),
      end: parseInt(process.env.PORT_RANGE_END || '3100')
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100') // 100 requests per window
    },
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '300000'), // 5 minutes
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    logLevel: (process.env.LOG_LEVEL as any) || 'info'
  }
}

export const config = createDefaultConfig()

// Validate configuration
export function validateConfig(config: ServerConfig): void {
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Invalid port number')
  }
  
  if (config.portRange.start >= config.portRange.end) {
    throw new Error('Invalid port range')
  }
  
  if (config.maxConcurrentPresentations < 1) {
    throw new Error('maxConcurrentPresentations must be at least 1')
  }
  
  if (config.defaultTTL < 60000) { // Minimum 1 minute
    throw new Error('defaultTTL must be at least 60000ms (1 minute)')
  }
}

validateConfig(config)
