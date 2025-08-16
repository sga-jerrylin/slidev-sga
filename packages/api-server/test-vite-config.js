// 测试 vite.config.js 创建
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testViteConfig() {
  const testDir = path.join(__dirname, 'test-vite-config-dir')
  
  try {
    // 创建测试目录
    await fs.ensureDir(testDir)
    
    // 创建 vite.config.js
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
    
    const configPath = path.join(testDir, 'vite.config.js')
    await fs.writeFile(configPath, viteConfig)
    
    console.log('✅ vite.config.js 创建成功')
    console.log('📁 路径:', configPath)
    
    // 验证文件存在
    const exists = await fs.pathExists(configPath)
    console.log('📄 文件存在:', exists)
    
    // 读取文件内容
    const content = await fs.readFile(configPath, 'utf8')
    console.log('📝 文件内容:')
    console.log(content)
    
    // 清理
    await fs.remove(testDir)
    console.log('🧹 清理完成')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testViteConfig()
