#!/usr/bin/env node

/**
 * Example client for Slidev API Server
 * 
 * This demonstrates how external agents can interact with the API
 * to generate presentations from markdown content.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

// Example markdown content
const exampleMarkdown = `---
theme: seriph
background: https://source.unsplash.com/1920x1080/?nature,presentation
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## AI Generated Presentation
  Created dynamically via Slidev API
drawings:
  persist: false
transition: slide-left
title: AI Generated Presentation
mdc: true
---

# AI Generated Presentation

Welcome to this dynamically created presentation

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

---
transition: fade-out
---

# What is this?

This presentation was generated dynamically using:

- 🤖 **AI Agent** - Intelligent content generation
- 📝 **Markdown** - Simple text-based content
- 🎨 **Slidev** - Modern presentation framework
- 🚀 **API** - RESTful service integration

<br>
<br>

> The future of presentations is **dynamic** and **intelligent**

---

# Key Features

<div grid="~ cols-2 gap-4">
<div>

## 🔄 Dynamic Generation
- Real-time presentation creation
- No manual setup required
- Instant deployment

## 🎯 AI Integration
- Smart content processing
- Automated formatting
- Intelligent layouts

</div>
<div>

## 🌐 Web-Based
- Access from anywhere
- No software installation
- Cross-platform compatibility

## ⚡ High Performance
- Fast generation
- Optimized delivery
- Scalable architecture

</div>
</div>

---
layout: center
class: text-center
---

# Live Demo

This presentation is running live at:

**{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}**

<div class="pt-12">
  <span class="text-6xl">🎉</span>
</div>

---

# Technical Architecture

\`\`\`mermaid
graph LR
    A[AI Agent] -->|POST JSON| B[API Server]
    B -->|Generate| C[Slidev Instance]
    C -->|Serve| D[Web Presentation]
    E[User] -->|Access| D
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
\`\`\`

---

# Code Example

Here's how to generate this presentation:

\`\`\`javascript
const response = await fetch('/api/presentations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '# My Presentation\\n\\nSlide content...',
    title: 'AI Generated Presentation',
    theme: 'seriph',
    ttl: 3600000
  })
})

const { url } = await response.json()
console.log('Presentation ready at:', url)
\`\`\`

---
layout: center
class: text-center
---

# Thank You!

**Questions?**

<div class="pt-12 text-sm opacity-75">
Generated dynamically by Slidev API Server
</div>`

/**
 * Make HTTP request to API
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${error.message} (${error.code})`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Request failed: ${error.message}`)
    throw error
  }
}

/**
 * Create a new presentation
 */
async function createPresentation(content, options = {}) {
  console.log('🚀 Creating presentation...')
  
  const requestBody = {
    content,
    title: options.title || 'AI Generated Presentation',
    theme: options.theme || 'seriph',
    ttl: options.ttl || 3600000, // 1 hour
    ...options
  }

  const result = await apiRequest('/api/presentations', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  })

  console.log('✅ Presentation created successfully!')
  console.log(`📊 ID: ${result.id}`)
  console.log(`🌐 URL: ${result.urls.presentation}`)
  console.log(`👨‍🏫 Presenter: ${result.urls.presenter}`)
  console.log(`📋 Overview: ${result.urls.overview}`)
  console.log(`🖨️ Print: ${result.urls.print}`)
  console.log(`⏰ Expires: ${result.expiresAt}`)

  return result
}

/**
 * List all presentations
 */
async function listPresentations() {
  console.log('📋 Listing presentations...')
  
  const result = await apiRequest('/api/presentations')
  
  console.log(`📊 Total: ${result.total}, Active: ${result.active}`)
  
  if (result.presentations.length > 0) {
    console.log('\nActive presentations:')
    result.presentations.forEach(p => {
      console.log(`  • ${p.id} - ${p.status} - ${p.title || 'Untitled'}`)
    })
  } else {
    console.log('No active presentations')
  }

  return result
}

/**
 * Get health status
 */
async function getHealth() {
  console.log('🏥 Checking health...')
  
  const result = await apiRequest('/api/health')
  
  console.log(`💚 Status: ${result.status}`)
  console.log(`📊 Active presentations: ${result.activePresentations}`)
  console.log(`🔌 Available ports: ${result.availablePorts}`)
  console.log(`💾 Memory: ${result.memoryUsage.percentage}%`)
  console.log(`💿 Disk: ${result.diskUsage.percentage}%`)

  return result
}

/**
 * Main demo function
 */
async function main() {
  console.log('🎯 Slidev API Client Demo')
  console.log(`🌐 API Base URL: ${API_BASE_URL}`)
  console.log('=' .repeat(50))

  try {
    // Check health first
    await getHealth()
    console.log()

    // List existing presentations
    await listPresentations()
    console.log()

    // Create a new presentation
    const presentation = await createPresentation(exampleMarkdown, {
      title: 'AI Generated Demo Presentation',
      theme: 'seriph',
      customCSS: `
        .slidev-page {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      `
    })

    console.log()
    console.log('🎉 Demo completed successfully!')
    console.log(`🌐 Open your browser to: ${presentation.urls.presentation}`)
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message)
    process.exit(1)
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { createPresentation, listPresentations, getHealth, apiRequest }
