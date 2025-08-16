// 简单的 Slidev 测试
import fs from 'fs-extra'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testSimpleSlidev() {
  const testDir = path.join(__dirname, 'test-slidev-simple')
  
  try {
    // 创建测试目录
    await fs.ensureDir(testDir)
    
    // 创建最简单的 slides.md
    const simpleSlides = `---
theme: default
---

# 测试标题

这是一个简单的测试页面

---

# 第二页

这是第二页内容
`
    
    await fs.writeFile(path.join(testDir, 'slides.md'), simpleSlides)
    
    console.log('✅ 创建了简单的测试文件')
    console.log('📁 测试目录:', testDir)
    console.log('📄 slides.md 内容:')
    console.log(simpleSlides)
    
    // 启动 Slidev
    console.log('\n🚀 启动 Slidev...')
    const slidevProcess = spawn('npx', ['slidev', '--port', '3003'], {
      cwd: testDir,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    slidevProcess.stdout.on('data', (data) => {
      console.log('Slidev stdout:', data.toString())
    })
    
    slidevProcess.stderr.on('data', (data) => {
      console.log('Slidev stderr:', data.toString())
    })
    
    slidevProcess.on('close', (code) => {
      console.log('Slidev process exited with code:', code)
    })
    
    // 等待一段时间
    setTimeout(() => {
      console.log('\n🔍 测试访问 http://localhost:3003')
      slidevProcess.kill()
    }, 30000)
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testSimpleSlidev()
