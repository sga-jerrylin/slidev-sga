import { join } from 'node:path'
import { nanoid } from 'nanoid'
import fs from 'fs-extra'
import { logger } from './logger.js'
import { config } from './config.js'
import { portManager } from './port-manager.js'
import type { GeneratePPTRequest } from './types.js'

export interface DockerContainer {
  id: string
  containerId: string
  port: number
  projectPath: string
  createdAt: Date
  expiresAt: Date
  status: 'starting' | 'running' | 'stopped' | 'error'
  request: GeneratePPTRequest
}

export class DockerManager {
  private containers = new Map<string, DockerContainer>()
  private readonly imageName = 'slidev-api:latest'
  private readonly tempDir: string

  constructor() {
    this.tempDir = config.tempDir
    this.ensureDockerImage()
  }

  /**
   * 确保 Docker 镜像存在
   */
  private async ensureDockerImage(): Promise<void> {
    try {
      const { exec } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const execAsync = promisify(exec)

      // 检查镜像是否存在
      try {
        await execAsync(`docker image inspect ${this.imageName}`)
        logger.info('Docker image already exists', { imageName: this.imageName })
        return
      } catch {
        logger.info('Docker image not found, building...', { imageName: this.imageName })
      }

      // 构建镜像
      const dockerfilePath = join(process.cwd(), 'docker')
      await execAsync(`docker build -t ${this.imageName} -f docker/Dockerfile.slidev .`, {
        cwd: process.cwd(),
        timeout: 600000 // 10 minutes for build
      })

      logger.info('Docker image built successfully', { imageName: this.imageName })
    } catch (error) {
      logger.error('Failed to ensure Docker image', { error })
      throw new Error('Docker setup failed')
    }
  }

  /**
   * 创建新的演示容器
   */
  async createPresentation(request: GeneratePPTRequest): Promise<DockerContainer> {
    const id = `slidev-${nanoid(12)}`
    const projectPath = join(this.tempDir, id)
    const port = await portManager.allocatePort()

    try {
      logger.info('Creating Docker presentation', { id, port, projectPath })

      // 创建项目目录
      await fs.ensureDir(projectPath)

      // 创建 slides.md 文件
      await this.createSlidesFile(projectPath, request)

      // 创建自定义 CSS 文件（如果有）
      if (request.customCSS) {
        await this.createCustomCSS(projectPath, request.customCSS)
      }

      // 启动 Docker 容器
      const containerId = await this.startContainer(id, projectPath, port, request)

      // 创建容器记录
      const container: DockerContainer = {
        id,
        containerId,
        port,
        projectPath,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (request.ttl || config.defaultTTL)),
        status: 'starting',
        request
      }

      this.containers.set(id, container)

      // 等待容器启动
      await this.waitForContainer(container)

      logger.info('Docker presentation created successfully', { id, containerId, port })
      return container

    } catch (error) {
      logger.error('Failed to create Docker presentation', { id, error })
      
      // 清理资源
      portManager.releasePort(port)
      try {
        await fs.remove(projectPath)
      } catch (cleanupError) {
        logger.error('Failed to cleanup project path', { projectPath, cleanupError })
      }

      throw error
    }
  }

  /**
   * 启动 Docker 容器
   */
  private async startContainer(
    id: string, 
    projectPath: string, 
    port: number, 
    request: GeneratePPTRequest
  ): Promise<string> {
    const { exec } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const execAsync = promisify(exec)

    const containerName = `slidev-${id}`
    
    // Docker 运行命令
    const dockerCmd = [
      'docker run',
      '-d', // 后台运行
      `--name ${containerName}`,
      `-p ${port}:3000`, // 端口映射
      `-v "${projectPath}:/app/slides"`, // 挂载项目目录
      '--rm', // 容器停止时自动删除
      `--memory=512m`, // 内存限制
      `--cpus=0.5`, // CPU 限制
      this.imageName
    ].join(' ')

    try {
      const result = await execAsync(dockerCmd, {
        timeout: 30000 // 30 seconds timeout
      })

      const containerId = result.stdout.trim()
      logger.info('Docker container started', { id, containerId, port })
      
      return containerId
    } catch (error) {
      logger.error('Failed to start Docker container', { id, error })
      throw new Error(`Failed to start container: ${error}`)
    }
  }

  /**
   * 等待容器启动完成
   */
  private async waitForContainer(container: DockerContainer): Promise<void> {
    const maxWaitTime = 60000 // 60 seconds
    const checkInterval = 2000 // 2 seconds
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 检查容器状态
        const isHealthy = await this.checkContainerHealth(container.containerId)
        
        if (isHealthy) {
          container.status = 'running'
          logger.info('Container is healthy and running', { 
            id: container.id, 
            containerId: container.containerId 
          })
          return
        }

        // 等待一段时间再检查
        await new Promise(resolve => setTimeout(resolve, checkInterval))
      } catch (error) {
        logger.warn('Error checking container health', { 
          id: container.id, 
          error: error.message 
        })
      }
    }

    // 超时
    container.status = 'error'
    throw new Error(`Container failed to start within ${maxWaitTime}ms`)
  }

  /**
   * 检查容器健康状态
   */
  private async checkContainerHealth(containerId: string): Promise<boolean> {
    try {
      const { exec } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const execAsync = promisify(exec)

      // 检查容器是否在运行
      await execAsync(`docker inspect --format='{{.State.Running}}' ${containerId}`)
      
      // 这里可以添加更多健康检查，比如 HTTP 请求
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 创建 slides.md 文件
   */
  private async createSlidesFile(projectPath: string, request: GeneratePPTRequest): Promise<void> {
    const frontmatter = {
      theme: request.theme || 'default',
      title: request.title || 'Generated Presentation',
      class: 'text-center',
      transition: 'slide-left',
      mdc: true,
      ...request.frontmatter,
      ...request.config
    }

    const frontmatterYaml = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: ${value}`
        }
        return `${key}: ${JSON.stringify(value)}`
      })
      .join('\n')

    const slidesContent = `---
${frontmatterYaml}
---

${request.content}
`

    await fs.writeFile(join(projectPath, 'slides.md'), slidesContent)
  }

  /**
   * 创建自定义 CSS 文件
   */
  private async createCustomCSS(projectPath: string, customCSS: string): Promise<void> {
    const stylesDir = join(projectPath, 'styles')
    await fs.ensureDir(stylesDir)
    await fs.writeFile(join(stylesDir, 'custom.css'), customCSS)
  }

  /**
   * 停止并删除容器
   */
  async deletePresentation(id: string): Promise<boolean> {
    const container = this.containers.get(id)
    if (!container) {
      return false
    }

    try {
      logger.info('Deleting Docker presentation', { id, containerId: container.containerId })

      const { exec } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const execAsync = promisify(exec)

      // 停止容器
      try {
        await execAsync(`docker stop ${container.containerId}`, { timeout: 10000 })
      } catch (error) {
        logger.warn('Failed to stop container gracefully', { containerId: container.containerId })
        // 强制删除
        await execAsync(`docker rm -f ${container.containerId}`, { timeout: 5000 })
      }

      // 释放端口
      portManager.releasePort(container.port)

      // 清理项目文件
      await fs.remove(container.projectPath)

      // 从记录中移除
      this.containers.delete(id)

      logger.info('Docker presentation deleted successfully', { id })
      return true

    } catch (error) {
      logger.error('Failed to delete Docker presentation', { id, error })
      throw error
    }
  }

  /**
   * 获取容器信息
   */
  getPresentation(id: string): DockerContainer | undefined {
    return this.containers.get(id)
  }

  /**
   * 获取所有容器
   */
  getAllPresentations(): DockerContainer[] {
    return Array.from(this.containers.values())
  }

  /**
   * 清理过期容器
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date()
    const expiredIds: string[] = []

    for (const [id, container] of this.containers) {
      if (container.expiresAt <= now) {
        expiredIds.push(id)
      }
    }

    logger.info('Cleaning up expired Docker containers', { expiredCount: expiredIds.length })

    let cleanedCount = 0
    for (const id of expiredIds) {
      try {
        await this.deletePresentation(id)
        cleanedCount++
      } catch (error) {
        logger.error('Failed to cleanup expired container', { id, error })
      }
    }

    return cleanedCount
  }

  /**
   * 关闭所有容器
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Docker manager')

    const containerIds = Array.from(this.containers.keys())
    for (const id of containerIds) {
      try {
        await this.deletePresentation(id)
      } catch (error) {
        logger.error('Error during Docker shutdown cleanup', { id, error })
      }
    }

    logger.info('Docker manager shutdown complete')
  }
}

// 创建单例实例
export const dockerManager = new DockerManager()
