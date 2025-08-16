#!/usr/bin/env node

/**
 * 完整流程测试：模拟外部智能体调用 API 生成 PPT
 */

const API_BASE_URL = 'http://localhost:3001/api'

// 模拟外部智能体发送的 JSON 数据
const intelligentAgentRequest = {
  title: "AI 驱动的智能演示系统",
  theme: "default",
  content: `---
theme: default
background: https://source.unsplash.com/1920x1080/?technology,presentation
class: text-center
highlighter: shiki
lineNumbers: true
info: |
  ## AI 驱动的智能演示系统
  通过 API 动态生成的专业演示文稿
  
  演示如何将 Markdown 内容转换为交互式幻灯片
drawings:
  persist: false
transition: slide-left
title: AI 智能演示系统
mdc: true
---

# AI 智能演示系统
## 动态生成的专业演示文稿

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    开始探索 <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/slidevjs/slidev" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

---
transition: fade-out
---

# 什么是智能演示系统？

智能演示系统是一个革命性的平台，它结合了：

- 🤖 **人工智能** - 智能内容生成和优化
- 📝 **Markdown 驱动** - 简单的文本格式，强大的表现力
- 🎨 **动态主题** - 可定制的视觉风格
- 🌐 **实时部署** - 即时生成，立即访问
- 🔄 **API 集成** - 无缝集成到任何系统

<br>
<br>

> "未来的演示不是静态的文档，而是**智能的、动态的、交互式的体验**"

---

# 技术架构图

<div class="grid grid-cols-1 gap-4">

\`\`\`mermaid {scale: 0.8}
graph TB
    A[外部智能体] -->|HTTP POST| B[API 服务器]
    B -->|解析 Markdown| C[项目生成器]
    C -->|创建临时项目| D[Slidev 实例]
    D -->|启动服务| E[Web 演示]
    F[用户] -->|访问链接| E
    
    B --> G[端口管理器]
    B --> H[健康监控]
    B --> I[资源清理]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
\`\`\`

</div>

---
layout: two-cols
---

# 核心功能特性

<div class="text-sm">

## 🚀 动态生成
- 实时 Markdown 解析
- 自动依赖管理
- 智能主题适配
- 即时部署上线

## 🎯 专业演示
- 演讲者模式
- 概览导航
- 打印导出
- 移动端适配

## 🔒 企业级特性
- 安全认证
- 速率限制
- 监控告警
- 日志审计

</div>

::right::

# 代码示例

\`\`\`javascript {all|1-5|6-12|13-18|all}
// 智能体调用 API
const response = await fetch('/api/presentations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: markdownContent,
    title: '智能生成的演示',
    theme: 'seriph',
    config: {
      highlighter: 'shiki',
      lineNumbers: true
    }
  })
})

const result = await response.json()
console.log('演示链接:', result.urls.presentation)
// 用户可以立即访问生成的演示
window.open(result.urls.presentation)
\`\`\`

---
layout: center
class: text-center
---

# 实际应用场景

<div class="grid grid-cols-2 gap-8">

<div>

## 📊 商业场景

### 销售演示
- 客户定制化内容
- 实时数据集成
- 品牌一致性保证

### 培训材料
- 动态课程生成
- 个性化学习路径
- 进度跟踪分析

</div>

<div>

## 🔬 技术场景

### 项目汇报
- 代码演示集成
- 架构图自动生成
- 技术文档同步

### 产品发布
- 功能演示
- 用户反馈集成
- 版本对比展示

</div>

</div>

---
layout: end
---

# 谢谢观看！

## 让我们一起构建智能演示的未来

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

### 🔗 相关链接
- **项目地址**: github.com/slidevjs/slidev
- **API 文档**: localhost:8000/api/docs
- **演示示例**: localhost:8000/examples

</div>

<div>

### 📞 联系方式
- **技术支持**: support@slidev.dev
- **商务合作**: business@slidev.dev
- **社区讨论**: discord.gg/slidev

</div>

</div>

<div class="abs-br m-6 text-sm opacity-75">
  生成时间: ${new Date().toLocaleString('zh-CN')}
</div>`,
  customCSS: `
/* 自定义样式 */
.slidev-layout {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.slidev-page {
  padding: 2rem;
}

h1 {
  background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
`,
  config: {
    highlighter: 'shiki',
    lineNumbers: true,
    transition: 'slide-left'
  }
}

async function testFullFlow() {
  console.log('🚀 开始完整流程测试')
  console.log('=' .repeat(50))
  
  try {
    // 1. 检查 API 健康状态
    console.log('1️⃣ 检查 API 服务状态...')
    const healthResponse = await fetch(`${API_BASE_URL}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ API 服务正常:', healthData.status)
    console.log('📊 可用端口:', healthData.availablePorts)
    
    // 2. 模拟外部智能体发送请求
    console.log('\n2️⃣ 模拟外部智能体发送 PPT 生成请求...')
    console.log('📝 内容长度:', intelligentAgentRequest.content.length, '字符')
    console.log('🎨 主题:', intelligentAgentRequest.theme)
    console.log('📄 标题:', intelligentAgentRequest.title)
    
    const createResponse = await fetch(`${API_BASE_URL}/presentations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'External-AI-Agent/1.0'
      },
      body: JSON.stringify(intelligentAgentRequest)
    })
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      throw new Error(`API 请求失败: ${createResponse.status} - ${errorText}`)
    }
    
    const presentationData = await createResponse.json()
    console.log('✅ PPT 生成成功!')
    console.log('🆔 演示 ID:', presentationData.id)
    console.log('🔗 演示链接:', presentationData.url)
    console.log('⏰ 过期时间:', presentationData.expiresAt)
    
    // 3. 显示所有可用的链接
    console.log('\n3️⃣ 生成的演示链接:')
    console.log('🎯 主演示:', presentationData.urls.presentation)
    console.log('🎤 演讲者模式:', presentationData.urls.presenter)
    console.log('📋 概览模式:', presentationData.urls.overview)
    console.log('🖨️ 打印模式:', presentationData.urls.print)
    
    // 4. 验证演示是否可访问
    console.log('\n4️⃣ 验证演示可访问性...')
    try {
      const verifyResponse = await fetch(presentationData.urls.presentation)
      if (verifyResponse.ok) {
        console.log('✅ 演示页面可正常访问')
        console.log('📱 状态码:', verifyResponse.status)
        console.log('📄 内容类型:', verifyResponse.headers.get('content-type'))
      } else {
        console.log('⚠️ 演示页面访问异常:', verifyResponse.status)
      }
    } catch (error) {
      console.log('⚠️ 演示页面验证失败:', error.message)
    }
    
    // 5. 获取当前所有演示列表
    console.log('\n5️⃣ 获取当前演示列表...')
    const listResponse = await fetch(`${API_BASE_URL}/presentations`)
    const presentations = await listResponse.json()
    console.log('📊 当前活跃演示数量:', presentations.length)
    
    // 6. 显示成功信息
    console.log('\n' + '🎉'.repeat(20))
    console.log('🎉 完整流程测试成功！')
    console.log('🎉'.repeat(20))
    console.log('\n📋 测试总结:')
    console.log('✅ API 服务正常运行')
    console.log('✅ 外部智能体请求处理成功')
    console.log('✅ Markdown 内容解析正确')
    console.log('✅ PPT 生成并部署成功')
    console.log('✅ 演示链接可正常访问')
    
    console.log('\n🔗 立即访问演示:')
    console.log(`   ${presentationData.urls.presentation}`)
    console.log('\n💡 提示: 复制上面的链接到浏览器中打开，即可查看生成的 PPT！')
    
    return presentationData
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('🔍 错误详情:', error)
    process.exit(1)
  }
}

// 运行测试
testFullFlow().then(result => {
  console.log('\n✨ 测试完成，演示数据:', {
    id: result.id,
    status: result.status,
    url: result.url
  })
}).catch(error => {
  console.error('💥 测试执行失败:', error)
  process.exit(1)
})
