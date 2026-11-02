import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Map all Highcharts imports to the ESM source builds so that the core
 * and every module share the same `Globals.js` singleton. Without this,
 * `import Highcharts from 'highcharts'` resolves to the CJS build while
 * module files reference `../../Core/Globals.js`, giving two separate
 * Highcharts instances — one uninitialised.
 *
 * Regex `find` patterns ensure exact matching so the alias does not
 * interfere with other packages like `highcharts-react-official`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^highcharts$/,
        replacement: 'highcharts/es-modules/masters/highcharts.src.js',
      },
      {
        find: /^highcharts\/highcharts-more$/,
        replacement: 'highcharts/es-modules/masters/highcharts-more.src.js',
      },
      {
        find: /^highcharts\/modules\/heatmap$/,
        replacement: 'highcharts/es-modules/masters/modules/heatmap.src.js',
      },
      {
        find: /^highcharts\/modules\/sankey$/,
        replacement: 'highcharts/es-modules/masters/modules/sankey.src.js',
      },
      {
        find: /^highcharts\/modules\/pattern-fill$/,
        replacement: 'highcharts/es-modules/masters/modules/pattern-fill.src.js',
      },
    ],
  },
})
