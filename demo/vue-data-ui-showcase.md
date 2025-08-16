---
theme: default
background: https://source.unsplash.com/1920x1080/?data,visualization
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Vue Data UI Integration Showcase
  
  Demonstrating the power of data visualization in Slidev with Vue Data UI
drawings:
  persist: false
transition: slide-left
title: Vue Data UI in Slidev
mdc: true
---

# Vue Data UI Integration

## Powerful Data Visualization for Slidev

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor">
    <carbon:edit />
  </button>
  <a href="https://github.com/sga-jerrylin/slidev-sga" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

---

# What is Vue Data UI?

Vue Data UI is a comprehensive data visualization library for Vue 3 with **50+ chart components**.

<div grid="~ cols-2 gap-4">
<div>

## Features
- 📊 **50+ Chart Types** - From basic to advanced visualizations
- 🎨 **Highly Customizable** - Themes, colors, animations
- 📱 **Responsive Design** - Works on all screen sizes  
- 🚀 **Performance Optimized** - Handles large datasets
- 📤 **Export Ready** - PDF, PNG, CSV exports
- 🎯 **Interactive** - Hover, click, zoom capabilities

</div>
<div>

## Chart Categories
- **Basic Charts**: Line, Bar, Pie, Scatter
- **Advanced Charts**: Radar, Heatmap, Treemap, Funnel
- **Specialized**: Gauge, Sparklines, Rating, KPI
- **3D Charts**: 3D Bar charts
- **Maps**: World map visualizations
- **Tables**: Data tables with sparklines

</div>
</div>

---

# Simple Markdown Syntax

You can create charts using simple Markdown code blocks:

<div grid="~ cols-2 gap-4">
<div>

## Line Chart
````markdown
```line
{
  "dataset": [
    {
      "name": "Sales",
      "values": [10, 20, 30, 40, 50],
      "color": "#42b883"
    }
  ]
}
```
````

## Donut Chart
````markdown
```donut
{
  "dataset": [
    { "name": "Desktop", "value": 60 },
    { "name": "Mobile", "value": 35 },
    { "name": "Tablet", "value": 5 }
  ]
}
```
````

</div>
<div>

<VueUiSparkline 
  :dataset="[10, 20, 30, 40, 50, 45, 55, 60]" 
  :config="{
    style: {
      backgroundColor: 'transparent',
      line: { color: '#42b883', strokeWidth: 3 }
    }
  }" 
/>

<br>

<VueUiDonut 
  :dataset="[
    { name: 'Desktop', value: 60, color: '#4285f4' },
    { name: 'Mobile', value: 35, color: '#34a853' },
    { name: 'Tablet', value: 5, color: '#fbbc04' }
  ]" 
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        layout: {
          donut: { strokeWidth: 80 }
        }
      }
    }
  }"
  style="height: 200px;"
/>

</div>
</div>

---

# Advanced Charts

<div grid="~ cols-2 gap-4">
<div>

## Radar Chart
<VueUiRadar 
  :dataset="{
    categories: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'],
    series: [
      {
        name: 'Product A',
        values: [80, 90, 70, 85, 75],
        color: '#42b883'
      },
      {
        name: 'Product B', 
        values: [70, 85, 90, 80, 85],
        color: '#ff6b6b'
      }
    ]
  }"
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        backgroundColor: 'transparent'
      }
    }
  }"
  style="height: 300px;"
/>

</div>
<div>

## Gauge Chart
<VueUiGauge 
  :dataset="{
    value: 75,
    min: 0,
    max: 100
  }"
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        backgroundColor: 'transparent',
        color: '#1a1a1a'
      }
    }
  }"
  style="height: 300px;"
/>

</div>
</div>

---

# Interactive Components

<div grid="~ cols-2 gap-4">
<div>

## Rating Component
<VueUiRating 
  :dataset="{ rating: 4.5, max: 5 }" 
  :config="{
    style: {
      backgroundColor: 'transparent',
      rating: { 
        color: '#ffd700',
        size: 40
      }
    }
  }"
/>

## KPI Display
<VueUiKpi 
  :dataset="1234567"
  :config="{
    style: {
      backgroundColor: 'transparent',
      title: { color: '#1a1a1a' },
      value: { color: '#42b883' }
    },
    title: 'Total Revenue',
    suffix: '$'
  }"
/>

</div>
<div>

## Sparklines
<div class="space-y-4">
  <div>
    <h4>Website Traffic</h4>
    <VueUiSparkline 
      :dataset="[100, 120, 140, 130, 160, 180, 170, 200]" 
      :config="{
        style: {
          backgroundColor: 'transparent',
          line: { color: '#4285f4', strokeWidth: 2 }
        }
      }" 
    />
  </div>
  
  <div>
    <h4>Sales Performance</h4>
    <VueUiSparkbar 
      :dataset="[
        { name: 'Q1', value: 100 },
        { name: 'Q2', value: 150 },
        { name: 'Q3', value: 120 },
        { name: 'Q4', value: 180 }
      ]" 
      :config="{
        style: {
          backgroundColor: 'transparent'
        }
      }" 
    />
  </div>
</div>

</div>
</div>

---

# Real-world Example: Sales Dashboard

<div grid="~ cols-3 gap-4">
<div>

### Monthly Revenue
<VueUiXy 
  :dataset="[
    {
      name: 'Revenue',
      values: [50000, 65000, 45000, 70000, 80000, 75000],
      color: '#42b883'
    }
  ]"
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        backgroundColor: 'transparent',
        grid: { show: true }
      }
    }
  }"
  style="height: 200px;"
/>

</div>
<div>

### Market Share
<VueUiDonut 
  :dataset="[
    { name: 'Our Product', value: 45, color: '#42b883' },
    { name: 'Competitor A', value: 30, color: '#ff6b6b' },
    { name: 'Competitor B', value: 15, color: '#4ecdc4' },
    { name: 'Others', value: 10, color: '#95a5a6' }
  ]" 
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        layout: {
          donut: { strokeWidth: 60 }
        }
      }
    }
  }"
  style="height: 200px;"
/>

</div>
<div>

### Performance Score
<VueUiGauge 
  :dataset="{
    value: 87,
    min: 0,
    max: 100
  }"
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        backgroundColor: 'transparent'
      }
    }
  }"
  style="height: 200px;"
/>

</div>
</div>

<div class="mt-8 text-center">
  <h3>Key Metrics</h3>
  <div grid="~ cols-4 gap-4">
    <VueUiKpi :dataset="1250000" :config="{ title: 'Total Revenue', prefix: '$', style: { backgroundColor: 'transparent' } }" />
    <VueUiKpi :dataset="87" :config="{ title: 'Customer Satisfaction', suffix: '%', style: { backgroundColor: 'transparent' } }" />
    <VueUiKpi :dataset="15000" :config="{ title: 'Active Users', style: { backgroundColor: 'transparent' } }" />
    <VueUiKpi :dataset="23" :config="{ title: 'Growth Rate', suffix: '%', style: { backgroundColor: 'transparent' } }" />
  </div>
</div>

---

# Getting Started

## Installation & Usage

1. **Vue Data UI is now built into Slidev** - no additional installation needed!

2. **Use Markdown syntax** for quick charts:
   ```markdown
   ```xy
   { "dataset": [...], "config": {...} }
   ```
   ```

3. **Or use Vue components directly**:
   ```vue
   <VueUiDonut :dataset="data" :config="config" />
   ```

4. **Extensive customization** available through config objects

5. **Export capabilities** - PDF, PNG, CSV built-in

## Documentation
- 📚 [Vue Data UI Docs](https://vue-data-ui.graphieros.com/)
- 🎯 [Slidev Integration Guide](/features/vue-data-ui)
- 💡 [Examples & Templates](https://github.com/sga-jerrylin/slidev-sga)

---

# Thank You!

<div class="text-center">
  <h2>Vue Data UI + Slidev = 🚀</h2>
  <p class="text-xl opacity-80">Powerful data visualization for developer presentations</p>
  
  <div class="mt-12">
    <VueUiSparkline 
      :dataset="[1, 3, 2, 8, 5, 7, 4, 6, 9, 10]" 
      :config="{
        style: {
          backgroundColor: 'transparent',
          line: { color: '#42b883', strokeWidth: 4 }
        }
      }" 
    />
  </div>
  
  <div class="mt-8">
    <a href="https://github.com/sga-jerrylin/slidev-sga" target="_blank" class="text-xl">
      🌟 Star on GitHub
    </a>
  </div>
</div>
