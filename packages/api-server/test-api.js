// Simple test script for the Slidev API Server

const API_BASE_URL = 'http://localhost:8000'

// Test markdown content - Rich presentation with 8 slides
const testMarkdown = `---
theme: seriph
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

<!--
这是演讲者备注：
- 欢迎大家参加今天的演示
- 这个演示文稿是通过 API 动态生成的
- 展示了 AI 与演示技术的结合
-->

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

<!--
演讲者备注：
- 强调智能化的特点
- 提到与传统 PPT 的区别
- 可以举例说明应用场景
-->

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

<!--
演讲者备注：
- 解释整个系统的工作流程
- 强调各个组件的作用
- 提到系统的可扩展性
-->

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

<!--
演讲者备注：
- 展示 API 调用的简单性
- 强调配置的灵活性
- 提到响应速度
-->

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

### 报告展示
- 自动化报告生成
- 数据可视化
- 多格式导出

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

### 团队协作
- 会议纪要生成
- 决策记录
- 知识分享

</div>

</div>

<!--
演讲者备注：
- 举具体的使用案例
- 强调不同行业的适用性
- 可以分享客户反馈
-->

---

# 性能与监控

<div class="grid grid-cols-3 gap-4">

<div class="bg-blue-50 p-4 rounded">

## 📈 性能指标

- **响应时间**: < 2秒
- **并发支持**: 100+ 实例
- **可用性**: 99.9%
- **扩展性**: 水平扩展

</div>

<div class="bg-green-50 p-4 rounded">

## 🔍 监控功能

- 实时健康检查
- 资源使用监控
- 错误日志追踪
- 性能指标收集

</div>

<div class="bg-purple-50 p-4 rounded">

## 🛡️ 安全保障

- API 速率限制
- 输入内容验证
- 资源隔离
- 自动清理机制

</div>

</div>

\`\`\`typescript
// 健康检查示例
interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  activePresentations: number
  availablePorts: number
  memoryUsage: { percentage: number }
  diskUsage: { percentage: number }
}
\`\`\`

<!--
演讲者备注：
- 强调系统的稳定性
- 提到监控的重要性
- 可以展示实际的监控界面
-->

---
layout: center
class: text-center
---

# 未来发展方向

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

## 🔮 技术演进

- **AI 内容优化**
  - 智能排版建议
  - 内容质量评估
  - 自动化改进

- **多媒体集成**
  - 视频内容嵌入
  - 音频解说生成
  - 交互式元素

</div>

<div>

## 🌍 生态扩展

- **平台集成**
  - 企业系统对接
  - 第三方工具支持
  - 云服务部署

- **社区建设**
  - 模板市场
  - 插件生态
  - 开发者工具

</div>

</div>

<div class="mt-8">
  <span class="text-6xl">🚀</span>
</div>

<!--
演讲者备注：
- 展望技术发展趋势
- 强调生态系统的重要性
- 邀请大家参与贡献
-->

---
layout: end
---

# 谢谢观看！

## 让我们一起构建智能演示的未来

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

### 🔗 相关链接
- **项目地址**: github.com/slidevjs/slidev
- **API 文档**: localhost:3000/api/docs
- **演示示例**: localhost:3000/examples

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
</div>

<!--
演讲者备注：
- 感谢听众的参与
- 提供后续联系方式
- 邀请提问和讨论
-->
`

async function testAPI() {
  console.log('🧪 Testing Slidev API Server')
  console.log('=' .repeat(40))

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...')
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`)
    const health = await healthResponse.json()
    console.log('✅ Health:', health.status)
    console.log('📊 Available ports:', health.availablePorts)
    console.log()

    // Test 2: Create presentation
    console.log('2️⃣ Creating presentation...')
    const createResponse = await fetch(`${API_BASE_URL}/api/presentations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: testMarkdown,
        title: 'API Test Presentation',
        theme: 'default',
        ttl: 1800000 // 30 minutes
      })
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(`Failed to create presentation: ${error.message}`)
    }

    const presentation = await createResponse.json()
    console.log('✅ Presentation created!')
    console.log('🆔 ID:', presentation.id)
    console.log('🌐 URL:', presentation.urls.presentation)
    console.log('👨‍🏫 Presenter:', presentation.urls.presenter)
    console.log('📋 Overview:', presentation.urls.overview)
    console.log()

    // Test 3: List presentations
    console.log('3️⃣ Listing presentations...')
    const listResponse = await fetch(`${API_BASE_URL}/api/presentations`)
    const list = await listResponse.json()
    console.log('✅ Found', list.total, 'presentations')
    console.log('🟢 Active:', list.active)
    console.log()

    // Test 4: Get specific presentation
    console.log('4️⃣ Getting presentation details...')
    const detailResponse = await fetch(`${API_BASE_URL}/api/presentations/${presentation.id}`)
    const details = await detailResponse.json()
    console.log('✅ Retrieved details for:', details.id)
    console.log('📊 Status:', details.status)
    console.log()

    // Test 5: Check if presentation is accessible
    console.log('5️⃣ Testing presentation accessibility...')
    try {
      const presentationResponse = await fetch(presentation.urls.presentation)
      if (presentationResponse.ok) {
        console.log('✅ Presentation is accessible!')
      } else {
        console.log('⚠️ Presentation not yet ready (status:', presentationResponse.status, ')')
      }
    } catch (error) {
      console.log('⚠️ Presentation not yet accessible:', error.message)
    }
    console.log()

    console.log('🎉 All tests completed successfully!')
    console.log()
    console.log('🌐 Open your browser to view the presentation:')
    console.log('   Main:', presentation.urls.presentation)
    console.log('   Presenter:', presentation.urls.presenter)
    console.log('   Overview:', presentation.urls.overview)
    console.log('   Print:', presentation.urls.print)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testAPI()
