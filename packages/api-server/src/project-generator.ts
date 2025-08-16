import { join } from 'node:path'
import { nanoid } from 'nanoid'
import fs from 'fs-extra'
import { logger } from './logger.js'
import { config } from './config.js'
import type { GeneratePPTRequest } from './types.js'

export class ProjectGenerator {
  private readonly tempDir: string
  private templatePath?: string

  constructor(tempDir?: string) {
    this.tempDir = tempDir || config.tempDir
    this.initializeTemplate()
  }

  /**
   * Initialize a template project with pre-installed dependencies
   */
  private async initializeTemplate(): Promise<void> {
    this.templatePath = join(this.tempDir, '_template')

    try {
      // Check if template already exists and is valid
      if (await this.isTemplateValid()) {
        logger.info('Valid template project already exists', { templatePath: this.templatePath })
        return
      }

      logger.info('Creating/updating template project', { templatePath: this.templatePath })

      // Clean up any existing broken template
      if (await fs.pathExists(this.templatePath)) {
        await fs.remove(this.templatePath)
      }

      await fs.ensureDir(this.templatePath)

      // Create template package.json with exact versions
      const templatePackageJson = {
        name: "slidev-template",
        type: "module",
        private: true,
        scripts: {
          build: "slidev build",
          dev: "slidev --open",
          export: "slidev export"
        },
        dependencies: {
          "@slidev/cli": "52.1.0",
          "@slidev/theme-default": "0.25.0",
          "@slidev/theme-seriph": "0.25.0",
          "vue": "3.5.18"
        }
      }

      await fs.writeFile(
        join(this.templatePath, 'package.json'),
        JSON.stringify(templatePackageJson, null, 2)
      )

      // Create .npmrc for faster installs
      await fs.writeFile(
        join(this.templatePath, '.npmrc'),
        'audit=false\nfund=false\nprefer-offline=true\nprogress=false\n'
      )

      // Install dependencies with retry logic
      await this.installDependenciesWithRetry(this.templatePath)

      // Verify installation
      await this.verifyTemplate()

      logger.info('Template project created successfully', { templatePath: this.templatePath })
    } catch (error) {
      logger.error('Failed to create template project', { error })
      // Mark template as invalid
      this.templatePath = undefined
    }
  }

  /**
   * Check if template is valid and has all required dependencies
   */
  private async isTemplateValid(): Promise<boolean> {
    if (!this.templatePath || !await fs.pathExists(this.templatePath)) {
      return false
    }

    try {
      // Check if node_modules exists and has required packages
      const nodeModulesPath = join(this.templatePath, 'node_modules')
      if (!await fs.pathExists(nodeModulesPath)) {
        return false
      }

      // Check for critical packages
      const requiredPackages = [
        '@slidev/cli',
        '@slidev/theme-default',
        '@slidev/theme-seriph'
      ]

      for (const pkg of requiredPackages) {
        const pkgPath = join(nodeModulesPath, pkg)
        if (!await fs.pathExists(pkgPath)) {
          logger.warn('Missing required package in template', { package: pkg })
          return false
        }
      }

      return true
    } catch (error) {
      logger.error('Error validating template', { error })
      return false
    }
  }

  /**
   * Install dependencies with retry logic and better error handling
   */
  private async installDependenciesWithRetry(projectPath: string, maxRetries: number = 3): Promise<void> {
    const { exec } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const execAsync = promisify(exec)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Installing dependencies (attempt ${attempt}/${maxRetries})`, { projectPath })

        // Use different strategies for each attempt
        let command: string
        if (attempt === 1) {
          command = 'npm install --no-audit --no-fund --prefer-offline'
        } else if (attempt === 2) {
          command = 'npm install --no-audit --no-fund --force'
        } else {
          command = 'npm install --no-audit --no-fund --legacy-peer-deps'
        }

        const result = await execAsync(command, {
          cwd: projectPath,
          timeout: 300000, // 5 minutes
          maxBuffer: 1024 * 1024 * 50, // 50MB buffer
          env: {
            ...process.env,
            NODE_ENV: 'production',
            npm_config_loglevel: 'error'
          }
        })

        logger.info('Dependencies installed successfully', {
          projectPath,
          attempt,
          stdout: result.stdout?.slice(0, 500) // Log first 500 chars
        })
        return

      } catch (error: any) {
        logger.error(`Dependency installation failed (attempt ${attempt}/${maxRetries})`, {
          projectPath,
          attempt,
          error: {
            code: error.code,
            signal: error.signal,
            killed: error.killed,
            stdout: error.stdout?.slice(0, 500),
            stderr: error.stderr?.slice(0, 500)
          }
        })

        if (attempt === maxRetries) {
          throw new Error(`Failed to install dependencies after ${maxRetries} attempts: ${error.message}`)
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
      }
    }
  }

  /**
   * Verify template installation
   */
  private async verifyTemplate(): Promise<void> {
    if (!this.templatePath) {
      throw new Error('Template path not set')
    }

    // Check package.json
    const packageJsonPath = join(this.templatePath, 'package.json')
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error('Template package.json not found')
    }

    // Check node_modules
    const nodeModulesPath = join(this.templatePath, 'node_modules')
    if (!await fs.pathExists(nodeModulesPath)) {
      throw new Error('Template node_modules not found')
    }

    // Check Slidev CLI
    const slidevCliPath = join(nodeModulesPath, '@slidev/cli')
    if (!await fs.pathExists(slidevCliPath)) {
      throw new Error('Slidev CLI not found in template')
    }

    logger.info('Template verification successful', { templatePath: this.templatePath })
  }

  /**
   * Generate a unique project ID
   */
  generateProjectId(): string {
    return `slidev-${nanoid(12)}`
  }

  /**
   * Create a new Slidev project without installing dependencies
   */
  async createProjectWithoutDeps(request: GeneratePPTRequest): Promise<{ id: string; projectPath: string }> {
    const id = this.generateProjectId()
    const projectPath = join(this.tempDir, id)

    try {
      logger.info('Creating project without dependencies', { id, projectPath })

      // Ensure temp directory exists
      await fs.ensureDir(this.tempDir)

      // Create project directory
      await fs.ensureDir(projectPath)

      // Create slides.md
      await this.createSlidesFile(projectPath, request)

      // Create components directory
      await fs.ensureDir(join(projectPath, 'components'))

      // Create public directory
      await fs.ensureDir(join(projectPath, 'public'))

      // Create custom CSS if provided
      if (request.customCSS) {
        await this.createCustomCSS(projectPath, request.customCSS)
      }

      // Create vite.config.js to fix __DEV__ issue
      await this.createViteConfig(projectPath)

      // Copy node_modules from template if available
      if (this.templatePath && await this.isTemplateValid()) {
        const templateNodeModules = join(this.templatePath, 'node_modules')
        const projectNodeModules = join(projectPath, 'node_modules')

        if (await fs.pathExists(templateNodeModules)) {
          logger.info('Copying node_modules from template', { templateNodeModules, projectNodeModules })
          await fs.copy(templateNodeModules, projectNodeModules)
          logger.info('node_modules copied successfully')
        }
      }

      logger.info('Project created successfully (no deps)', { id, projectPath })

      return { id, projectPath }
    } catch (error) {
      logger.error('Failed to create project', { id, error })

      // Cleanup on failure
      try {
        await fs.remove(projectPath)
      } catch (cleanupError) {
        logger.error('Failed to cleanup project after error', { id, cleanupError })
      }

      throw error
    }
  }

  /**
   * Create a new Slidev project from the request (with dependencies)
   */
  async createProject(request: GeneratePPTRequest): Promise<{ id: string; projectPath: string }> {
    const id = this.generateProjectId()
    const projectPath = join(this.tempDir, id)

    try {
      logger.info('Creating project', { id, projectPath })

      // Ensure temp directory exists
      await fs.ensureDir(this.tempDir)

      // Try to use template first, fallback to manual creation
      if (this.templatePath && await this.isTemplateValid()) {
        logger.info('Copying from validated template', { templatePath: this.templatePath, projectPath })

        // Copy entire template including node_modules
        await fs.copy(this.templatePath, projectPath, {
          filter: (src, dest) => {
            // Skip some unnecessary files but keep node_modules
            const relativePath = src.replace(this.templatePath!, '')
            return !relativePath.includes('.git') && !relativePath.includes('.DS_Store')
          }
        })

        // Update package.json with unique name
        const packageJsonPath = join(projectPath, 'package.json')
        const packageJson = await fs.readJson(packageJsonPath)
        const { nanoid: generateId } = await import('nanoid')
        packageJson.name = `slidev-presentation-${generateId(8)}`
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })

        logger.info('Project copied from template successfully', { projectPath })
      } else {
        logger.warn('Template not available, creating project manually', { projectPath })

        // Fallback: create project manually and install dependencies
        await fs.ensureDir(projectPath)
        await this.createPackageJsonWithDeps(projectPath, request)

        // Install dependencies for this specific project
        await this.installDependenciesWithRetry(projectPath, 2) // Fewer retries for individual projects
      }

      // Create slides.md
      await this.createSlidesFile(projectPath, request)

      // Create components directory
      await fs.ensureDir(join(projectPath, 'components'))

      // Create public directory
      await fs.ensureDir(join(projectPath, 'public'))

      // Create vite.config.ts if needed
      await this.createViteConfig(projectPath, request)

      // Create .gitignore
      await this.createGitignore(projectPath)

      // Create custom CSS if provided
      if (request.customCSS) {
        await this.createCustomCSS(projectPath, request.customCSS)
      }

      logger.info('Project created successfully', { id, projectPath })

      return { id, projectPath }
    } catch (error) {
      logger.error('Failed to create project', { id, error })

      // Cleanup on failure
      try {
        await fs.remove(projectPath)
      } catch (cleanupError) {
        logger.error('Failed to cleanup project after error', { id, cleanupError })
      }

      throw error
    }
  }

  /**
   * Create minimal package.json for the project (no dependencies)
   */
  private async createMinimalPackageJson(projectPath: string, request: GeneratePPTRequest): Promise<void> {
    const packageJson = {
      name: `slidev-presentation-${nanoid(8)}`,
      type: "module",
      private: true,
      scripts: {
        build: "slidev build",
        dev: "slidev --open",
        export: "slidev export"
      }
    }

    await fs.writeFile(
      join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
  }

  /**
   * Create package.json for the project (with dependencies)
   */
  private async createPackageJson(projectPath: string, request: GeneratePPTRequest): Promise<void> {
    const packageJson = {
      name: `slidev-presentation-${nanoid(8)}`,
      type: "module",
      private: true,
      scripts: {
        build: "slidev build",
        dev: "slidev --open",
        export: "slidev export"
      },
      dependencies: {
        "@slidev/cli": "^52.1.0",
        "@slidev/theme-default": "^52.1.0",
        "@slidev/theme-seriph": "^52.1.0"
      }
    }

    // Add theme dependency if specified
    if (request.theme && request.theme !== 'default' && request.theme !== 'seriph') {
      packageJson.dependencies[`@slidev/theme-${request.theme}`] = "latest"
    }

    await fs.writeFile(
      join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    // Dependencies should already be installed from template copy
    // If not using template, this will be handled by the fallback logic above
  }

  /**
   * Create the main slides.md file
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
          // Properly quote string values in YAML
          return `${key}: "${value}"`
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
   * Create vite.config.ts if custom configuration is needed
   */
  private async createViteConfig(projectPath: string, request: GeneratePPTRequest): Promise<void> {
    // Only create if there's custom configuration
    if (!request.config) return

    const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  // Custom configuration can be added here
  plugins: [],
})
`

    await fs.writeFile(join(projectPath, 'vite.config.ts'), viteConfig)
  }

  /**
   * Create .gitignore file
   */
  private async createGitignore(projectPath: string): Promise<void> {
    const gitignoreContent = `node_modules
dist
.slidev
.vite
.DS_Store
*.log
`

    await fs.writeFile(join(projectPath, '.gitignore'), gitignoreContent)
  }

  /**
   * Create custom CSS file
   */
  private async createCustomCSS(projectPath: string, customCSS: string): Promise<void> {
    const stylesDir = join(projectPath, 'styles')
    await fs.ensureDir(stylesDir)
    await fs.writeFile(join(stylesDir, 'custom.css'), customCSS)
  }

  /**
   * Create vite.config.js to fix __DEV__ issue
   */
  private async createViteConfig(projectPath: string): Promise<void> {
    const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __TEST__: JSON.stringify(process.env.NODE_ENV === 'test')
  },
  server: {
    fs: {
      strict: false
    }
  }
})
`
    await fs.writeFile(join(projectPath, 'vite.config.js'), viteConfig)
  }

  /**
   * Clean up a project directory
   */
  async cleanupProject(projectPath: string): Promise<void> {
    try {
      await fs.remove(projectPath)
      logger.info('Project cleaned up', { projectPath })
    } catch (error) {
      logger.error('Failed to cleanup project', { projectPath, error })
      throw error
    }
  }

  /**
   * Get project directory size
   */
  async getProjectSize(projectPath: string): Promise<number> {
    try {
      const stats = await fs.stat(projectPath)
      return stats.size
    } catch (error) {
      logger.error('Failed to get project size', { projectPath, error })
      return 0
    }
  }
}

// Create singleton instance
export const projectGenerator = new ProjectGenerator()
