// 手动修复当前运行的 Slidev 项目
import fs from 'fs-extra'
import path from 'path'

async function fixCurrentProject() {
  const projectPath = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\slidev-api\\slidev-u6viWcENUDgk"
  
  try {
    // 检查项目是否存在
    const exists = await fs.pathExists(projectPath)
    console.log('📁 项目存在:', exists)
    
    if (!exists) {
      console.log('❌ 项目不存在')
      return
    }
    
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
    
    const configPath = path.join(projectPath, 'vite.config.js')
    await fs.writeFile(configPath, viteConfig)
    
    console.log('✅ vite.config.js 创建成功')
    console.log('📁 路径:', configPath)
    
    // 验证文件
    const content = await fs.readFile(configPath, 'utf8')
    console.log('📝 文件内容:')
    console.log(content)
    
    console.log('\n🔄 请重新启动 Slidev 服务器以应用配置')
    
  } catch (error) {
    console.error('❌ 修复失败:', error)
  }
}

fixCurrentProject()
