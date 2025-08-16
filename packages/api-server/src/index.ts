#!/usr/bin/env node

import { apiServer } from './server.js'

// Start the server
apiServer.start().catch((error) => {
  console.error('Failed to start Slidev API Server:', error)
  process.exit(1)
})

// Export for programmatic use
export { apiServer } from './server.js'
export { config } from './config.js'
export { logger } from './logger.js'
export * from './types.js'
export * from './error-handler.js'
