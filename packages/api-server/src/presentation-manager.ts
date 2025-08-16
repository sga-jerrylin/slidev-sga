import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { logger } from './logger.js'
import { config } from './config.js'
import { portManager } from './port-manager.js'
import { projectGenerator } from './project-generator.js'
import type { GeneratePPTRequest, PresentationInstance, GeneratePPTResponse } from './types.js'

export class PresentationManager {
  private instances = new Map<string, PresentationInstance>()
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Create a new presentation instance
   */
  async createPresentation(request: GeneratePPTRequest): Promise<GeneratePPTResponse> {
    // Check if we've reached the maximum number of concurrent presentations
    if (this.instances.size >= config.maxConcurrentPresentations) {
      throw new Error('Maximum number of concurrent presentations reached')
    }

    try {
      logger.info('Creating presentation', {
        title: request.title,
        theme: request.theme,
        contentLength: request.content.length
      })

      // Generate project without installing dependencies
      const { id, projectPath } = await projectGenerator.createProjectWithoutDeps(request)

      // Allocate port
      const port = await portManager.allocatePort()

      // Calculate expiration time
      const ttl = request.ttl || config.defaultTTL
      const expiresAt = new Date(Date.now() + ttl)

      logger.info('Starting Slidev server', { id, port, projectPath })

      let slidevProcess: any = null
      try {
        // Start Slidev server using command line
        slidevProcess = await this.startSlidevProcess(projectPath, port, request.theme || 'default')

        // Wait for server to be ready
        await this.waitForServerReady(port)
      } catch (error) {
        // Cleanup on failure
        logger.error('Failed to start Slidev server, cleaning up', { id, port, error })

        // Kill process if it was created
        if (slidevProcess && !slidevProcess.killed) {
          slidevProcess.kill('SIGKILL')
        }

        // Release port
        portManager.releasePort(port)

        // Cleanup project files
        await projectGenerator.cleanupProject(projectPath)

        throw error
      }

      // Create instance record
      const instance: PresentationInstance = {
        id,
        projectPath,
        server: slidevProcess,
        port,
        createdAt: new Date(),
        expiresAt,
        status: 'ready',
        request
      }

      this.instances.set(id, instance)

      logger.info('Presentation created successfully', {
        id,
        port,
        expiresAt: expiresAt.toISOString(),
        totalInstances: this.instances.size
      })

      // Generate response
      const baseUrl = `${config.baseUrl}:${port}`
      const response: GeneratePPTResponse = {
        id,
        url: baseUrl,
        status: 'ready',
        expiresAt: expiresAt.toISOString(),
        createdAt: instance.createdAt.toISOString(),
        urls: {
          presentation: `${baseUrl}/`,
          presenter: `${baseUrl}/presenter/`,
          overview: `${baseUrl}/overview/`,
          print: `${baseUrl}/print`
        }
      }

      return response
    } catch (error) {
      logger.error('Failed to create presentation', { error })
      throw error
    }
  }

  /**
   * Get presentation by ID
   */
  getPresentation(id: string): PresentationInstance | undefined {
    return this.instances.get(id)
  }

  /**
   * Get all presentations
   */
  getAllPresentations(): PresentationInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * Delete a presentation
   */
  async deletePresentation(id: string): Promise<boolean> {
    const instance = this.instances.get(id)
    if (!instance) {
      return false
    }

    try {
      logger.info('Deleting presentation', { id })

      // Kill Slidev process
      if (instance.server && !instance.server.killed) {
        instance.server.kill('SIGTERM')

        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Force kill if still running
        if (!instance.server.killed) {
          instance.server.kill('SIGKILL')
        }
      }

      // Release port
      portManager.releasePort(instance.port)

      // Cleanup project files
      await projectGenerator.cleanupProject(instance.projectPath)

      // Remove from instances
      this.instances.delete(id)

      logger.info('Presentation deleted successfully', {
        id,
        totalInstances: this.instances.size
      })

      return true
    } catch (error) {
      logger.error('Failed to delete presentation', { id, error })
      throw error
    }
  }

  /**
   * Cleanup expired presentations
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date()
    const expiredIds: string[] = []

    // Find expired instances
    for (const [id, instance] of this.instances) {
      if (instance.expiresAt <= now) {
        expiredIds.push(id)
      }
    }

    logger.info('Cleaning up expired presentations', { expiredCount: expiredIds.length })

    // Delete expired instances
    let cleanedCount = 0
    for (const id of expiredIds) {
      try {
        await this.deletePresentation(id)
        cleanedCount++
      } catch (error) {
        logger.error('Failed to cleanup expired presentation', { id, error })
      }
    }

    return cleanedCount
  }

  /**
   * Get presentation statistics
   */
  getStats() {
    const instances = Array.from(this.instances.values())
    const now = new Date()

    return {
      total: instances.length,
      active: instances.filter(i => i.status === 'ready').length,
      expired: instances.filter(i => i.expiresAt <= now).length,
      generating: instances.filter(i => i.status === 'generating').length,
      error: instances.filter(i => i.status === 'error').length,
      oldestCreated: instances.length > 0
        ? Math.min(...instances.map(i => i.createdAt.getTime()))
        : null,
      newestCreated: instances.length > 0
        ? Math.max(...instances.map(i => i.createdAt.getTime()))
        : null
    }
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpired()
      } catch (error) {
        logger.error('Error during scheduled cleanup', { error })
      }
    }, config.cleanupInterval)

    logger.info('Cleanup timer started', {
      intervalMs: config.cleanupInterval
    })
  }

  /**
   * Stop the cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
      logger.info('Cleanup timer stopped')
    }
  }

  /**
   * Shutdown all presentations
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down presentation manager')

    this.stopCleanupTimer()

    const instances = Array.from(this.instances.keys())
    for (const id of instances) {
      try {
        await this.deletePresentation(id)
      } catch (error) {
        logger.error('Error during shutdown cleanup', { id, error })
      }
    }

    portManager.clearAll()
    logger.info('Presentation manager shutdown complete')
  }

  /**
   * Start Slidev process
   */
  private async startSlidevProcess(projectPath: string, port: number, theme: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Use node directly to run slidev CLI
      const templatePath = join(config.tempDir, '_template')
      const slidevCliPath = join(templatePath, 'node_modules', '@slidev', 'cli', 'bin', 'slidev.mjs')

      const slidevProcess = spawn('node', [slidevCliPath, '--port', port.toString(), '--theme', theme, join(projectPath, 'slides.md')], {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'development',
          VITE_DEV: 'true',
          CI: 'true' // Prevent interactive prompts
        }
      })

      let resolved = false

      slidevProcess.stdout?.on('data', (data) => {
        const output = data.toString()
        logger.info('Slidev stdout', { output: output.trim() })

        // Auto-answer theme installation prompts
        if (output.includes('do you want to install it now?') || output.includes('(Y/n)')) {
          logger.info('Auto-answering theme installation prompt with Y')
          slidevProcess.stdin?.write('Y\n')
        }

        // Look for server ready indicators - Slidev shows URLs when ready
        if (output.includes('public slide show') || output.includes('http://localhost:')) {
          if (!resolved) {
            resolved = true
            resolve(slidevProcess)
          }
        }
      })

      slidevProcess.stderr?.on('data', (data) => {
        const output = data.toString()
        logger.warn('Slidev stderr', { output: output.trim() })
      })

      slidevProcess.on('error', (error) => {
        if (!resolved) {
          resolved = true
          reject(error)
        }
      })

      slidevProcess.on('exit', (code) => {
        if (!resolved && code !== 0) {
          resolved = true
          reject(new Error(`Slidev process exited with code ${code}`))
        }
      })

      // Timeout after 180 seconds (allow time for theme installation)
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          slidevProcess.kill('SIGKILL')
          reject(new Error('Slidev startup timeout'))
        }
      }, 180000)
    })
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServerReady(port: number): Promise<void> {
    const maxAttempts = 60  // Increased to 60 attempts
    const delay = 1000

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${port}`)
        if (response.ok) {
          logger.info('Slidev server is ready', { port })
          return
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }

    throw new Error(`Slidev server failed to start on port ${port}`)
  }
}

// Create singleton instance
export const presentationManager = new PresentationManager()
