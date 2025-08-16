import type { ResolvedSlidevOptions, SlidevPluginOptions } from '@slidev/types'
import { join } from 'node:path'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

// Vue Data UI component resolver
function VueDataUIResolver() {
  const components = [
    // Spark components
    'VueUiSparkline',
    'VueUiSparkbar',
    'VueUiSparkStackbar',
    'VueUiSparkHistogram',
    'VueUiSparkGauge',
    'VueUiSparkTrend',
    'VueUiGizmo',
    'VueUiBullet',

    // Charts
    'VueUiAgePyramid',
    'VueUiCandlestick',
    'VueUiChestnut',
    'VueUiChord',
    'VueUiCirclePack',
    'VueUiDonutEvolution',
    'VueUiDonut',
    'VueUiDumbbell',
    'VueUiFlow',
    'VueUiFunnel',
    'VueUiGalaxy',
    'VueUiGauge',
    'VueUiHeatmap',
    'VueUiHistoryPlot',
    'VueUiMolecule',
    'VueUiMoodRadar',
    'VueUiNestedDonuts',
    'VueUiOnion',
    'VueUiParallelCoordinatePlot',
    'VueUiQuadrant',
    'VueUiRadar',
    'VueUiRidgeline',
    'VueUiRings',
    'VueUiScatter',
    'VueUiStackbar',
    'VueUiStripPlot',
    'VueUiThermometer',
    'VueUiTiremarks',
    'VueUiTreemap',
    'VueUiVerticalBar',
    'VueUiWaffle',
    'VueUiWheel',
    'VueUiWordCloud',
    'VueUiXyCanvas',
    'VueUiXy',

    // 3D charts
    'VueUi3dBar',

    // Maps
    'VueUiWorld',

    // Data tables
    'VueUiTable',
    'VueUiTableHeatmap',
    'VueUiTableSparkline',
    'VueUiCarouselTable',

    // Rating
    'VueUiRating',
    'VueUiSmiley',

    // Utilities
    'VueUiAccordion',
    'VueUiAnnotator',
    'VueUiCursor',
    'VueUiDashboard',
    'VueUiDigits',
    'VueUiKpi',
    'VueUiMiniLoader',
    'VueUiSkeleton',
    'VueUiTimer',
    'VueUiIcon',
    'VueUiPattern',

    // Quick chart
    'VueUiQuickChart',
    'VueUiRelationCircle'
  ]

  return {
    type: 'component' as const,
    resolve: (name: string) => {
      if (components.includes(name)) {
        return {
          name,
          from: 'vue-data-ui'
        }
      }
    }
  }
}

export function createComponentsPlugin(
  { clientRoot, roots }: ResolvedSlidevOptions,
  pluginOptions: SlidevPluginOptions,
) {
  return Components({
    extensions: ['vue', 'md', 'js', 'ts', 'jsx', 'tsx'],

    dirs: [
      join(clientRoot, 'builtin'),
      ...roots.map(i => join(i, 'components')),
    ],
    globsExclude: [],

    include: [/\.vue$/, /\.vue\?vue/, /\.vue\?v=/, /\.md$/, /\.md\?vue/],
    exclude: [],

    resolvers: [
      IconsResolver({
        prefix: '',
        customCollections: Object.keys(pluginOptions.icons?.customCollections || []),
      }),
      VueDataUIResolver(),
    ],

    dts: false,

    ...pluginOptions.components,
  })
}
