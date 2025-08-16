# Vue Data UI Integration

Slidev includes **Vue Data UI**, a comprehensive data visualization library with 50+ chart components, making it easy to create beautiful and interactive charts in your presentations.

## Quick Start

### Using Markdown Syntax

The simplest way to add charts is using the special Markdown syntax:

````markdown
```xy
{
  "dataset": [
    {"name": "Sales", "values": [10, 20, 30, 40, 50]},
    {"name": "Profit", "values": [5, 15, 25, 35, 45]}
  ],
  "config": {
    "style": {
      "backgroundColor": "transparent"
    }
  }
}
```
````

### Using Vue Components

You can also use the components directly in your slides:

```vue
<VueUiDonut 
  :dataset="[
    { name: 'Chrome', value: 65, color: '#4285f4' },
    { name: 'Firefox', value: 20, color: '#ff9500' },
    { name: 'Safari', value: 15, color: '#007aff' }
  ]" 
  :config="{
    style: {
      backgroundColor: 'transparent',
      chart: {
        layout: {
          donut: {
            strokeWidth: 120
          }
        }
      }
    }
  }"
/>
```

## Available Chart Types

### Basic Charts
- **Line Charts**: `xy`, `line` - Perfect for time series data
- **Bar Charts**: `bar`, `stackbar` - Great for comparisons
- **Pie Charts**: `donut`, `pie` - Ideal for proportions
- **Scatter Plots**: `scatter` - Show correlations

### Advanced Charts
- **Radar Charts**: `radar` - Multi-dimensional data
- **Heatmaps**: `heatmap` - Matrix data visualization
- **Treemaps**: `treemap` - Hierarchical data
- **Funnel Charts**: `funnel` - Process flows

### Specialized Charts
- **Gauge Charts**: `gauge` - KPI displays
- **Sparklines**: `sparkline` - Inline mini charts
- **Rating Components**: `rating` - User feedback
- **KPI Cards**: `kpi` - Key metrics

## Syntax Examples

### Line Chart
````markdown
```line
{
  "dataset": [
    {
      "name": "Revenue",
      "values": [100, 120, 140, 160, 180],
      "color": "#42b883"
    }
  ]
}
```
````

### Donut Chart
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

### Bar Chart
````markdown
```bar
{
  "dataset": [
    { "name": "Q1", "value": 100 },
    { "name": "Q2", "value": 150 },
    { "name": "Q3", "value": 120 },
    { "name": "Q4", "value": 180 }
  ]
}
```
````

## Configuration

All charts support extensive configuration options:

```javascript
const config = {
  style: {
    backgroundColor: 'transparent', // Transparent background for slides
    chart: {
      color: '#1a1a1a', // Text color
      backgroundColor: '#ffffff', // Chart background
      // ... many more options
    }
  },
  userOptions: {
    show: true, // Show user options menu
    buttons: {
      pdf: true, // Enable PDF export
      img: true, // Enable image export
      csv: true  // Enable CSV export
    }
  }
}
```

## Responsive Design

Charts automatically adapt to different screen sizes. For presentations, you might want to:

```javascript
const config = {
  responsive: true,
  style: {
    backgroundColor: 'transparent',
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

## Best Practices for Presentations

1. **Use transparent backgrounds** to match your slide theme
2. **Keep animations subtle** to avoid distraction
3. **Use high contrast colors** for better visibility
4. **Limit data points** for clarity
5. **Add clear labels** and legends

## Complete Component List

Vue Data UI provides these components (all available in Slidev):

**Charts**: VueUiXy, VueUiDonut, VueUiVerticalBar, VueUiStackbar, VueUiScatter, VueUiRadar, VueUiGauge, VueUiHeatmap, VueUiTreemap, VueUiFunnel, VueUiWaffle, VueUiSparkline, and many more.

**Utilities**: VueUiKpi, VueUiRating, VueUiTimer, VueUiDashboard, VueUiAccordion, etc.

For the complete list and detailed documentation, visit the [Vue Data UI documentation](https://vue-data-ui.graphieros.com/).
