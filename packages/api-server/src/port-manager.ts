import { getPort } from 'get-port-please'
import { logger } from './logger.js'
import { config } from './config.js'

export class PortManager {
  private allocatedPorts = new Set<number>()
  private readonly startPort: number
  private readonly endPort: number

  constructor(startPort?: number, endPort?: number) {
    this.startPort = startPort || config.portRange.start
    this.endPort = endPort || config.portRange.end
    
    logger.info('PortManager initialized', {
      startPort: this.startPort,
      endPort: this.endPort
    })
  }

  /**
   * Allocate a free port from the configured range
   */
  async allocatePort(): Promise<number> {
    try {
      // Try to find an available port, excluding already allocated ones
      const excludePorts = Array.from(this.allocatedPorts)

      const port = await getPort({
        port: this.startPort,
        portRange: [this.startPort, this.endPort],
        exclude: excludePorts,
        random: false
      })

      if (port < this.startPort || port > this.endPort) {
        throw new Error(`No available ports in range ${this.startPort}-${this.endPort}`)
      }

      // Final check - this should not happen with exclude, but just in case
      if (this.allocatedPorts.has(port)) {
        logger.error('Port allocation conflict detected', { port, allocatedPorts: Array.from(this.allocatedPorts) })
        throw new Error(`Port allocation conflict: ${port} is already allocated`)
      }

      this.allocatedPorts.add(port)

      logger.info('Port allocated', {
        port,
        totalAllocated: this.allocatedPorts.size
      })

      return port
    } catch (error) {
      logger.error('Failed to allocate port', { error })
      throw new Error('No available ports in the configured range')
    }
  }

  /**
   * Release a previously allocated port
   */
  releasePort(port: number): void {
    if (this.allocatedPorts.has(port)) {
      this.allocatedPorts.delete(port)
      logger.info('Port released', { 
        port, 
        totalAllocated: this.allocatedPorts.size 
      })
    } else {
      logger.warn('Attempted to release unallocated port', { port })
    }
  }

  /**
   * Get list of currently allocated ports
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.allocatedPorts)
  }

  /**
   * Get number of available ports
   */
  getAvailablePortCount(): number {
    const totalPorts = this.endPort - this.startPort + 1
    return totalPorts - this.allocatedPorts.size
  }

  /**
   * Check if a specific port is allocated
   */
  isPortAllocated(port: number): boolean {
    return this.allocatedPorts.has(port)
  }

  /**
   * Get port usage statistics
   */
  getStats() {
    const totalPorts = this.endPort - this.startPort + 1
    const allocatedCount = this.allocatedPorts.size
    const availableCount = totalPorts - allocatedCount
    
    return {
      total: totalPorts,
      allocated: allocatedCount,
      available: availableCount,
      utilizationPercentage: Math.round((allocatedCount / totalPorts) * 100),
      allocatedPorts: Array.from(this.allocatedPorts),
      range: {
        start: this.startPort,
        end: this.endPort
      }
    }
  }

  /**
   * Clear all allocated ports (useful for cleanup)
   */
  clearAll(): void {
    const count = this.allocatedPorts.size
    this.allocatedPorts.clear()
    logger.info('All ports cleared', { clearedCount: count })
  }
}

// Create singleton instance
export const portManager = new PortManager()
