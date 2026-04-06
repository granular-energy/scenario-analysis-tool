import Highcharts, { HighchartsReact } from '../../highcharts'
import { useMemo } from 'react'
import type { SankeyLink } from '../../types'

interface SankeyDiagramProps {
  links: SankeyLink[]
}

function SankeyDiagram({ links }: SankeyDiagramProps) {
  const options = useMemo<Highcharts.Options>(() => ({
    chart: {
      style: { fontFamily: "'Inter', Arial, sans-serif" },
    },
    title: {
      text: 'Energy Allocation Flows',
    },
    subtitle: {
      text: 'Generator → Consumer (MWh)',
      style: { fontSize: '0.75rem', color: '#897F78' },
    },
    tooltip: {
      nodeFormat: '<b>{point.name}</b>: {point.sum:.1f} MWh',
      pointFormat: '{point.fromNode.name} → {point.toNode.name}: <b>{point.weight:.1f} MWh</b>',
    },
    series: [
      {
        type: 'sankey' as const,
        name: 'Allocation',
        keys: ['from', 'to', 'weight'],
        data: links.map((l) => [l.from, l.to, l.weight]),
        nodePadding: 20,
      },
    ],
    credits: { enabled: false },
  }), [links])

  if (links.length === 0) {
    return (
      <div className="sankey-block">
        <p className="chart-description">
          Set allocation percentages above to see energy flows.
        </p>
      </div>
    )
  }

  return (
    <div className="sankey-block">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  )
}

export default SankeyDiagram
