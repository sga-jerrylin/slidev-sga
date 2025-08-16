import type { SlidevConfig } from '@slidev/types'
import type { ChildProcess } from 'node:child_process'

export interface GeneratePPTRequest {
  /** Markdown content for the presentation */
  content: string
  /** Optional title for the presentation */
  title?: string
  /** Theme to use (default: 'default') */
  theme?: string
  /** Custom Slidev configuration */
  config?: Partial<SlidevConfig>
  /** TTL in milliseconds (default: 1 hour) */
  ttl?: number
  /** Custom CSS styles */
  customCSS?: string
  /** Additional frontmatter */
  frontmatter?: Record<string, any>
}

export interface GeneratePPTResponse {
  /** Unique presentation ID */
  id: string
  /** Access URL for the presentation */
  url: string
  /** Current status */
  status: 'generating' | 'ready' | 'error' | 'expired'
  /** Error message if status is 'error' */
  error?: string
  /** Expiration timestamp */
  expiresAt: string
  /** Creation timestamp */
  createdAt: string
  /** Additional URLs */
  urls: {
    /** Main presentation URL */
    presentation: string
    /** Presenter mode URL */
    presenter: string
    /** Overview URL */
    overview: string
    /** Print URL */
    print: string
  }
}

export interface PresentationInstance {
  /** Unique ID */
  id: string
  /** Project directory path */
  projectPath: string
  /** Slidev process instance */
  server: ChildProcess
  /** Port number */
  port: number
  /** Creation timestamp */
  createdAt: Date
  /** Expiration timestamp */
  expiresAt: Date
  /** Current status */
  status: 'generating' | 'ready' | 'error' | 'expired'
  /** Error message if any */
  error?: string
  /** Original request data */
  request: GeneratePPTRequest
}

export interface ServerConfig {
  /** Server port */
  port: number
  /** Host to bind to */
  host: string
  /** Base URL for generated presentations */
  baseUrl: string
  /** Directory for temporary projects */
  tempDir: string
  /** Maximum number of concurrent presentations */
  maxConcurrentPresentations: number
  /** Default TTL for presentations (ms) */
  defaultTTL: number
  /** Port range for presentations */
  portRange: {
    start: number
    end: number
  }
  /** Rate limiting configuration */
  rateLimit: {
    windowMs: number
    max: number
  }
  /** Cleanup interval (ms) */
  cleanupInterval: number
  /** Enable CORS */
  enableCors: boolean
  /** Enable compression */
  enableCompression: boolean
  /** Log level */
  logLevel: 'error' | 'warn' | 'info' | 'debug'
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  activePresentations: number
  availablePorts: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  diskUsage: {
    used: number
    total: number
    percentage: number
  }
}

export interface ListPresentationsResponse {
  presentations: Array<{
    id: string
    status: PresentationInstance['status']
    createdAt: string
    expiresAt: string
    url: string
    title?: string
  }>
  total: number
  active: number
}

export interface ApiError {
  error: string
  message: string
  code: string
  timestamp: string
  requestId?: string
}
