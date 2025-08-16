import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import fs from 'fs-extra'
import { logger } from './logger.js'
import { config } from './config.js'
import { portManager } from './port-manager.js'
import { presentationManager } from './presentation-manager.js'
import type { HealthCheckResponse } from './types.js'

const execAsync = promisify(exec)

export class HealthMonitor {
  private startTime: Date
  private lastHealthCheck: Date | null = null

  constructor() {
    this.startTime = new Date()
  }

  /**
   * Perform comprehensive health check
   */
  async getHealthStatus(): Promise<HealthCheckResponse> {
    this.lastHealthCheck = new Date()
    
    try {
      const [memoryUsage, diskUsage] = await Promise.all([
        this.getMemoryUsage(),
        this.getDiskUsage()
      ])

      const portStats = portManager.getStats()
      const presentationStats = presentationManager.getStats()

      const status: HealthCheckResponse = {
        status: this.determineOverallStatus(memoryUsage, diskUsage, portStats),
        timestamp: this.lastHealthCheck.toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        activePresentations: presentationStats.active,
        availablePorts: portStats.available,
        memoryUsage,
        diskUsage
      }

      logger.debug('Health check completed', status)
      return status
    } catch (error) {
      logger.error('Health check failed', { error })
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        activePresentations: 0,
        availablePorts: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        diskUsage: { used: 0, total: 0, percentage: 0 }
      }
    }
  }

  /**
   * Get memory usage statistics
   */
  private async getMemoryUsage(): Promise<HealthCheckResponse['memoryUsage']> {
    const usage = process.memoryUsage()
    const totalMemory = require('os').totalmem()
    const usedMemory = usage.heapUsed + usage.external

    return {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100)
    }
  }

  /**
   * Get disk usage statistics
   */
  private async getDiskUsage(): Promise<HealthCheckResponse['diskUsage']> {
    try {
      // Check disk usage of temp directory
      const stats = await fs.stat(config.tempDir)
      
      // For Unix-like systems, use df command
      if (process.platform !== 'win32') {
        try {
          const { stdout } = await execAsync(`df -k "${config.tempDir}"`)
          const lines = stdout.trim().split('\n')
          const data = lines[1].split(/\s+/)
          
          const total = parseInt(data[1]) * 1024 // Convert KB to bytes
          const used = parseInt(data[2]) * 1024
          
          return {
            used: Math.round(used / 1024 / 1024), // MB
            total: Math.round(total / 1024 / 1024), // MB
            percentage: Math.round((used / total) * 100)
          }
        } catch (dfError) {
          logger.warn('Failed to get disk usage via df command', { error: dfError })
        }
      }

      // Fallback: estimate based on temp directory size
      const tempDirSize = await this.getDirectorySize(config.tempDir)
      const estimatedTotal = 10 * 1024 * 1024 * 1024 // Assume 10GB available

      return {
        used: Math.round(tempDirSize / 1024 / 1024), // MB
        total: Math.round(estimatedTotal / 1024 / 1024), // MB
        percentage: Math.round((tempDirSize / estimatedTotal) * 100)
      }
    } catch (error) {
      logger.warn('Failed to get disk usage', { error })
      return { used: 0, total: 0, percentage: 0 }
    }
  }

  /**
   * Calculate directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const stats = await fs.stat(dirPath)
      
      if (stats.isFile()) {
        return stats.size
      }
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(dirPath)
        const sizes = await Promise.all(
          files.map(file => this.getDirectorySize(`${dirPath}/${file}`))
        )
        return sizes.reduce((total, size) => total + size, 0)
      }
      
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(
    memory: HealthCheckResponse['memoryUsage'],
    disk: HealthCheckResponse['diskUsage'],
    ports: ReturnType<typeof portManager.getStats>
  ): 'healthy' | 'unhealthy' {
    // Check memory usage (unhealthy if > 90%)
    if (memory.percentage > 90) {
      logger.warn('High memory usage detected', { percentage: memory.percentage })
      return 'unhealthy'
    }

    // Check disk usage (unhealthy if > 95%)
    if (disk.percentage > 95) {
      logger.warn('High disk usage detected', { percentage: disk.percentage })
      return 'unhealthy'
    }

    // Check port availability (unhealthy if < 10% available)
    if (ports.utilizationPercentage > 90) {
      logger.warn('Low port availability detected', { utilization: ports.utilizationPercentage })
      return 'unhealthy'
    }

    return 'healthy'
  }

  /**
   * Get basic system information
   */
  getSystemInfo() {
    const os = require('os')
    
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      hostname: os.hostname(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      networkInterfaces: Object.keys(os.networkInterfaces())
    }
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    const portStats = portManager.getStats()
    const presentationStats = presentationManager.getStats()
    
    return {
      presentations: presentationStats,
      ports: portStats,
      config: {
        maxConcurrentPresentations: config.maxConcurrentPresentations,
        defaultTTL: config.defaultTTL,
        tempDir: config.tempDir,
        portRange: config.portRange
      },
      uptime: Date.now() - this.startTime.getTime(),
      lastHealthCheck: this.lastHealthCheck?.toISOString() || null
    }
  }

  /**
   * Check if service is ready to accept requests
   */
  async isReady(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus()
      return health.status === 'healthy' && health.availablePorts > 0
    } catch (error) {
      logger.error('Readiness check failed', { error })
      return false
    }
  }

  /**
   * Check if service is alive (basic liveness check)
   */
  isAlive(): boolean {
    return true // If this method is called, the process is alive
  }
}

// Create singleton instance
export const healthMonitor = new HealthMonitor()
