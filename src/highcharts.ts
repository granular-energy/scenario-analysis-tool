import Highcharts from 'highcharts'
import HeatmapModule from 'highcharts/modules/heatmap'
import SankeyModule from 'highcharts/modules/sankey'
import HighchartsReactModule from 'highcharts-react-official'

// Resolve CJS/ESM interop: the default import may be the module object
// containing a .default property, rather than the value itself.
function resolveDefault<T>(mod: T): T {
  const m = mod as unknown as { default?: T }
  return typeof m.default !== 'undefined' ? m.default : mod
}

// Initialize heatmap module
const heatmapInit = resolveDefault(HeatmapModule) as unknown as ((hc: typeof Highcharts) => void) | typeof Highcharts
if (typeof heatmapInit === 'function') {
  heatmapInit(Highcharts)
}

// Initialize sankey module
const sankeyInit = resolveDefault(SankeyModule) as unknown as ((hc: typeof Highcharts) => void) | typeof Highcharts
if (typeof sankeyInit === 'function') {
  sankeyInit(Highcharts)
}

// Export the resolved HighchartsReact component
export const HighchartsReact = resolveDefault(HighchartsReactModule)

export default Highcharts
