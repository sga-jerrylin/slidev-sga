import type { MarkdownTransformContext } from '@slidev/types'

/**
 * Transform Vue Data UI chart code blocks
 */
export function transformVueDataUI(ctx: MarkdownTransformContext) {
  // Transform chart blocks with syntax: ```chart:componentName
  ctx.s.replace(
    /^```chart:([a-zA-Z0-9]+) *(\{[^\n]*\})?\n([\s\S]+?)\n```/gm,
    (full, componentName = '', options = '', data = '') => {
      data = data.trim()
      options = options.trim() || '{}'
      
      // Convert component name to PascalCase if needed
      const pascalComponentName = componentName.charAt(0).toUpperCase() + componentName.slice(1)
      const fullComponentName = pascalComponentName.startsWith('VueUi') 
        ? pascalComponentName 
        : `VueUi${pascalComponentName}`
      
      // Parse the data as JSON and pass as props
      try {
        const parsedData = JSON.parse(data)
        const datasetProp = parsedData.dataset ? `:dataset="${JSON.stringify(parsedData.dataset).replace(/"/g, '&quot;')}"` : ''
        const configProp = parsedData.config ? `:config="${JSON.stringify(parsedData.config).replace(/"/g, '&quot;')}"` : ''
        
        return `<${fullComponentName} ${datasetProp} ${configProp} v-bind="${options}" />`
      } catch (e) {
        // If JSON parsing fails, treat as raw data
        return `<${fullComponentName} :dataset="${data.replace(/"/g, '&quot;')}" v-bind="${options}" />`
      }
    },
  )

  // Transform simple chart syntax: ```xy, ```donut, etc.
  const chartMappings: Record<string, string> = {
    'xy': 'VueUiXy',
    'line': 'VueUiXy',
    'donut': 'VueUiDonut',
    'pie': 'VueUiDonut',
    'bar': 'VueUiVerticalBar',
    'stackbar': 'VueUiStackbar',
    'scatter': 'VueUiScatter',
    'radar': 'VueUiRadar',
    'gauge': 'VueUiGauge',
    'heatmap': 'VueUiHeatmap',
    'treemap': 'VueUiTreemap',
    'funnel': 'VueUiFunnel',
    'waffle': 'VueUiWaffle',
    'sparkline': 'VueUiSparkline',
    'sparkbar': 'VueUiSparkbar',
    'table': 'VueUiTable',
    'rating': 'VueUiRating',
    'kpi': 'VueUiKpi'
  }

  Object.entries(chartMappings).forEach(([shortName, componentName]) => {
    const regex = new RegExp(`^\\`\\`\\`${shortName} *(\\{[^\\n]*\\})?\\n([\\s\\S]+?)\\n\\`\\`\\``, 'gm')
    ctx.s.replace(regex, (full, options = '', data = '') => {
      data = data.trim()
      options = options.trim() || '{}'
      
      try {
        const parsedData = JSON.parse(data)
        const datasetProp = parsedData.dataset ? `:dataset="${JSON.stringify(parsedData.dataset).replace(/"/g, '&quot;')}"` : ''
        const configProp = parsedData.config ? `:config="${JSON.stringify(parsedData.config).replace(/"/g, '&quot;')}"` : ''
        
        return `<${componentName} ${datasetProp} ${configProp} v-bind="${options}" />`
      } catch (e) {
        // If JSON parsing fails, treat as raw data
        return `<${componentName} :dataset="${data.replace(/"/g, '&quot;')}" v-bind="${options}" />`
      }
    })
  })
}
