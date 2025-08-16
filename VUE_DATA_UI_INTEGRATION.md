# Vue Data UI Integration for Slidev

This document describes the integration of Vue Data UI into Slidev, providing powerful data visualization capabilities for presentations.

## What's Been Added

### 1. Vue Data UI Library Integration
- Added `vue-data-ui` as a dependency in the catalog system
- All 50+ chart components are now available in Slidev
- Automatic component registration through custom resolver

### 2. Markdown Syntax Support
- New transformer for chart code blocks
- Simple syntax: ````chart:componentName` or shorthand like ````xy`, ````donut`
- JSON configuration support within code blocks

### 3. Component Auto-Import
- All Vue Data UI components are automatically imported
- No need for manual imports in slides
- TypeScript support included

### 4. Documentation and Examples
- Comprehensive documentation in `docs/features/vue-data-ui.md`
- Example presentation in `demo/vue-data-ui-showcase.md`
- Updated template with Vue Data UI examples

## Available Components

### Chart Components
- **Line/Area Charts**: `VueUiXy`, `VueUiSparkline`
- **Bar Charts**: `VueUiVerticalBar`, `VueUiStackbar`, `VueUiSparkbar`
- **Pie/Donut Charts**: `VueUiDonut`, `VueUiNestedDonuts`
- **Scatter Plots**: `VueUiScatter`, `VueUiQuadrant`
- **Radar Charts**: `VueUiRadar`, `VueUiMoodRadar`
- **Gauge Charts**: `VueUiGauge`, `VueUiSparkGauge`
- **Heatmaps**: `VueUiHeatmap`, `VueUiTableHeatmap`
- **Treemaps**: `VueUiTreemap`
- **Funnel Charts**: `VueUiFunnel`
- **And 30+ more specialized charts**

### Utility Components
- **KPI Displays**: `VueUiKpi`, `VueUiDigits`
- **Rating Systems**: `VueUiRating`, `VueUiSmiley`
- **Data Tables**: `VueUiTable`, `VueUiCarouselTable`
- **Dashboards**: `VueUiDashboard`
- **Timers**: `VueUiTimer`

## Usage Examples

### 1. Markdown Syntax (Recommended)

#### Simple Line Chart
````markdown
```xy
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

#### Donut Chart
````markdown
```donut
{
  "dataset": [
    { "name": "Desktop", "value": 60, "color": "#4285f4" },
    { "name": "Mobile", "value": 35, "color": "#34a853" },
    { "name": "Tablet", "value": 5, "color": "#fbbc04" }
  ]
}
```
````

#### Advanced Chart with Full Component Name
````markdown
```chart:VueUiRadar
{
  "dataset": {
    "categories": ["Speed", "Reliability", "Comfort"],
    "series": [
      {
        "name": "Product A",
        "values": [80, 90, 70],
        "color": "#42b883"
      }
    ]
  }
}
```
````

### 2. Vue Component Syntax

```vue
<template>
  <div>
    <!-- Simple sparkline -->
    <VueUiSparkline 
      :dataset="[1, 5, 3, 8, 2, 7, 4, 6]" 
      :config="sparklineConfig" 
    />
    
    <!-- KPI display -->
    <VueUiKpi 
      :dataset="1234567"
      :config="{
        title: 'Total Revenue',
        prefix: '$',
        style: { backgroundColor: 'transparent' }
      }"
    />
    
    <!-- Interactive donut chart -->
    <VueUiDonut 
      :dataset="pieData" 
      :config="pieConfig"
      @selectDatapoint="handleSelection"
    />
  </div>
</template>

<script setup>
const sparklineConfig = {
  style: {
    backgroundColor: 'transparent',
    line: { color: '#42b883', strokeWidth: 3 }
  }
}

const pieData = [
  { name: 'Chrome', value: 65, color: '#4285f4' },
  { name: 'Firefox', value: 20, color: '#ff9500' },
  { name: 'Safari', value: 15, color: '#007aff' }
]

const pieConfig = {
  style: {
    backgroundColor: 'transparent',
    chart: {
      layout: {
        donut: { strokeWidth: 120 }
      }
    }
  }
}

function handleSelection(datapoint) {
  console.log('Selected:', datapoint)
}
</script>
```

## Configuration for Presentations

### Transparent Backgrounds
For better integration with slide themes:

```javascript
const config = {
  style: {
    backgroundColor: 'transparent',
    chart: {
      backgroundColor: 'transparent',
      color: '#1a1a1a' // Adjust text color as needed
    }
  }
}
```

### Responsive Design
```javascript
const config = {
  responsive: true,
  style: {
    backgroundColor: 'transparent'
  }
}
```

### Animation Settings
```javascript
const config = {
  style: {
    chart: {
      animation: {
        use: true,
        speed: 1,
        acceleration: 1
      }
    }
  }
}
```

## File Structure

```
packages/slidev/
├── node/
│   ├── syntax/transform/
│   │   └── vue-data-ui.ts          # Markdown transformer
│   └── vite/
│       └── components.ts           # Component resolver
└── package.json                    # Updated dependencies

pnpm-workspace.yaml                 # Catalog configuration
docs/features/vue-data-ui.md        # Documentation
demo/vue-data-ui-showcase.md        # Example presentation
```

## Technical Implementation

### 1. Component Resolver
- Custom resolver in `packages/slidev/node/vite/components.ts`
- Automatically imports all Vue Data UI components
- No manual registration required

### 2. Markdown Transformer
- Located in `packages/slidev/node/syntax/transform/vue-data-ui.ts`
- Processes chart code blocks
- Supports both shorthand and full component names
- JSON configuration parsing

### 3. Dependency Management
- Added to pnpm catalog system
- Version managed centrally
- Consistent across all packages

## Best Practices

1. **Use transparent backgrounds** to match slide themes
2. **Keep animations subtle** to avoid distraction during presentations
3. **Use high contrast colors** for better visibility
4. **Limit data points** for clarity on slides
5. **Test on different screen sizes** for responsive presentations
6. **Leverage export features** for handouts and reports

## Troubleshooting

### Common Issues
1. **Component not found**: Ensure correct component name spelling
2. **JSON parsing errors**: Validate JSON syntax in code blocks
3. **Styling issues**: Use transparent backgrounds and appropriate colors
4. **Performance**: Use data downsampling for large datasets

### Getting Help
- [Vue Data UI Documentation](https://vue-data-ui.graphieros.com/)
- [Slidev Documentation](https://sli.dev/)
- [GitHub Issues](https://github.com/sga-jerrylin/slidev-sga/issues)

## Future Enhancements

- [ ] Theme integration for automatic color matching
- [ ] Additional shorthand syntax for common chart types
- [ ] Performance optimizations for large datasets
- [ ] Custom chart templates for presentations
- [ ] Integration with Slidev's export features

---

This integration brings powerful data visualization capabilities to Slidev, making it an ideal tool for data-driven presentations, technical talks, and business reports.
