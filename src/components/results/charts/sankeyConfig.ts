/**
 * Chart 5 — Sankey diagram (three-column layout).
 * Columns: Generators (left) → Consumers (centre) → Outcomes (right).
 * Outcome nodes: "Matched", "Excess", "Surplus generation".
 * Surplus flows run directly from generator to Surplus node in the outcomes column.
 */

import type Highcharts from 'highcharts'
import type { ConsumerResult, EngineResult, GeneratorUtilisation } from '../../../engine/types'
import {
  CHART_FONT_FAMILY,
  DEMAND_COLOUR,
  EXCESS_COLOUR,
  MATCHED_COLOUR,
  NEUTRAL_1000,
  UNALLOCATED_STRIPE,
  techAllocatedColour,
} from './palette'

export interface SankeyNode {
  id: string
  name: string
  color: string
  column?: number
}

export interface SankeyLink {
  from: string
  to: string
  weight: number
  color?: string
}

export interface SankeyInput {
  nodes: readonly SankeyNode[]
  links: readonly SankeyLink[]
}

/** Build Sankey data for the whole portfolio view (three-column layout). */
export function buildPortfolioSankey(
  result: EngineResult,
  generatorNames: ReadonlyMap<string, string>,
  consumerNames: ReadonlyMap<string, string>,
  technologyMap: ReadonlyMap<string, string>,
): SankeyInput {
  const nodes: SankeyNode[] = []
  const links: SankeyLink[] = []

  // Column 0: Generator nodes
  for (const gen of result.generators) {
    const tech = technologyMap.get(gen.generatorId) ?? 'unknown'
    nodes.push({
      id: `gen-${gen.generatorId}`,
      name: generatorNames.get(gen.generatorId) ?? gen.generatorId,
      color: techAllocatedColour(tech),
      column: 0,
    })
  }

  // Column 1: Consumer nodes
  for (const consumer of result.consumers) {
    nodes.push({
      id: `con-${consumer.consumerId}`,
      name: consumerNames.get(consumer.consumerId) ?? consumer.consumerId,
      color: DEMAND_COLOUR,
      column: 1,
    })
  }

  // Column 2: Outcome nodes
  nodes.push({ id: 'matched', name: 'Matched', color: MATCHED_COLOUR, column: 2 })

  const totalExcess = result.consumers.reduce((sum, c) => sum + c.totalExcessMWh, 0)
  if (totalExcess > 0.01) {
    nodes.push({ id: 'excess', name: 'Excess', color: EXCESS_COLOUR, column: 2 })
  }

  const totalSurplus = result.generators.reduce((sum, g) => sum + g.unallocatedMWh, 0)
  if (totalSurplus > 0.01) {
    nodes.push({
      id: 'surplus',
      name: 'Surplus generation',
      color: UNALLOCATED_STRIPE,
      column: 2,
    })
  }

  // Generator → Consumer links (allocated MWh)
  for (const gen of result.generators) {
    for (const [consumerId, allocMWh] of Object.entries(gen.allocatedByConsumer)) {
      if (allocMWh > 0.01) {
        const tech = technologyMap.get(gen.generatorId) ?? 'unknown'
        links.push({
          from: `gen-${gen.generatorId}`,
          to: `con-${consumerId}`,
          weight: Math.round(allocMWh * 100) / 100,
          color: techAllocatedColour(tech),
        })
      }
    }
  }

  // Consumer → Matched/Excess links
  for (const consumer of result.consumers) {
    if (consumer.totalMatchedMWh > 0.01) {
      links.push({
        from: `con-${consumer.consumerId}`,
        to: 'matched',
        weight: Math.round(consumer.totalMatchedMWh * 100) / 100,
        color: MATCHED_COLOUR,
      })
    }
    if (consumer.totalExcessMWh > 0.01) {
      links.push({
        from: `con-${consumer.consumerId}`,
        to: 'excess',
        weight: Math.round(consumer.totalExcessMWh * 100) / 100,
        color: EXCESS_COLOUR,
      })
    }
  }

  // Generator → Surplus links (directly to outcomes column, not via consumers)
  for (const gen of result.generators) {
    if (gen.unallocatedMWh > 0.01) {
      links.push({
        from: `gen-${gen.generatorId}`,
        to: 'surplus',
        weight: Math.round(gen.unallocatedMWh * 100) / 100,
        color: UNALLOCATED_STRIPE,
      })
    }
  }

  return { nodes, links }
}

/** Build Sankey data for a single consumer view (no surplus). */
export function buildConsumerSankey(
  consumer: ConsumerResult,
  generators: readonly GeneratorUtilisation[],
  generatorNames: ReadonlyMap<string, string>,
  consumerNames: ReadonlyMap<string, string>,
  technologyMap: ReadonlyMap<string, string>,
): SankeyInput {
  const nodes: SankeyNode[] = []
  const links: SankeyLink[] = []
  const consumerName = consumerNames.get(consumer.consumerId) ?? consumer.consumerId

  // Only include generators that contribute to this consumer
  const relevantGens = generators.filter((g) => {
    const alloc = g.allocatedByConsumer[consumer.consumerId]
    return alloc !== undefined && alloc > 0.01
  })

  // Column 0: Generator nodes
  for (const gen of relevantGens) {
    const tech = technologyMap.get(gen.generatorId) ?? 'unknown'
    nodes.push({
      id: `gen-${gen.generatorId}`,
      name: generatorNames.get(gen.generatorId) ?? gen.generatorId,
      color: techAllocatedColour(tech),
      column: 0,
    })
  }

  // Column 1: Consumer node
  nodes.push({
    id: `con-${consumer.consumerId}`,
    name: consumerName,
    color: DEMAND_COLOUR,
    column: 1,
  })

  // Column 2: Outcome nodes (no surplus — that's a portfolio-level concept)
  nodes.push({ id: 'matched', name: 'Matched', color: MATCHED_COLOUR, column: 2 })

  if (consumer.totalExcessMWh > 0.01) {
    nodes.push({ id: 'excess', name: 'Excess', color: EXCESS_COLOUR, column: 2 })
  }

  // Generator → Consumer
  for (const gen of relevantGens) {
    const allocMWh = gen.allocatedByConsumer[consumer.consumerId] ?? 0
    if (allocMWh > 0.01) {
      const tech = technologyMap.get(gen.generatorId) ?? 'unknown'
      links.push({
        from: `gen-${gen.generatorId}`,
        to: `con-${consumer.consumerId}`,
        weight: Math.round(allocMWh * 100) / 100,
        color: techAllocatedColour(tech),
      })
    }
  }

  // Consumer → Matched
  if (consumer.totalMatchedMWh > 0.01) {
    links.push({
      from: `con-${consumer.consumerId}`,
      to: 'matched',
      weight: Math.round(consumer.totalMatchedMWh * 100) / 100,
      color: MATCHED_COLOUR,
    })
  }

  // Consumer → Excess
  if (consumer.totalExcessMWh > 0.01) {
    links.push({
      from: `con-${consumer.consumerId}`,
      to: 'excess',
      weight: Math.round(consumer.totalExcessMWh * 100) / 100,
      color: EXCESS_COLOUR,
    })
  }

  return { nodes, links }
}

/**
 * Assert that Sankey flows balance: for each generator, the sum of outgoing
 * link weights equals its total generation MWh; for each consumer, ingoing
 * equals outgoing. Returns an array of error messages (empty if balanced).
 */
export function checkSankeyBalance(
  input: SankeyInput,
  generatorTotals: ReadonlyMap<string, number>,
): string[] {
  const errors: string[] = []

  // Check generator outgoing totals
  for (const [genNodeId, expectedTotal] of generatorTotals.entries()) {
    const outgoing = input.links.filter((l) => l.from === genNodeId).reduce((sum, l) => sum + l.weight, 0)
    if (Math.abs(outgoing - expectedTotal) > 0.5) {
      errors.push(
        `Generator ${genNodeId}: outgoing ${outgoing.toFixed(1)} ≠ total ${expectedTotal.toFixed(1)}`,
      )
    }
  }

  // Check consumer flow-through balance (ingoing = outgoing)
  const consumerNodeIds = input.nodes.filter((n) => n.id.startsWith('con-')).map((n) => n.id)
  for (const nodeId of consumerNodeIds) {
    const ingoing = input.links.filter((l) => l.to === nodeId).reduce((sum, l) => sum + l.weight, 0)
    const outgoing = input.links.filter((l) => l.from === nodeId).reduce((sum, l) => sum + l.weight, 0)
    if (Math.abs(ingoing - outgoing) > 0.5) {
      errors.push(`Consumer ${nodeId}: ingoing ${ingoing.toFixed(1)} ≠ outgoing ${outgoing.toFixed(1)}`)
    }
  }

  return errors
}

export function buildSankeyChartConfig(input: SankeyInput): Highcharts.Options {
  const nodeMap = input.nodes.map((n) => ({
    id: n.id,
    name: n.name,
    color: n.color,
    column: n.column,
  }))

  const data = input.links.map((l) => [l.from, l.to, l.weight])

  // Pre-compute each node's total outgoing weight for percentage calculations
  const nodeTotals = new Map<string, number>()
  for (const n of input.nodes) {
    const outgoing = input.links.filter((l) => l.from === n.id).reduce((sum, l) => sum + l.weight, 0)
    const incoming = input.links.filter((l) => l.to === n.id).reduce((sum, l) => sum + l.weight, 0)
    // Use whichever is larger — generators have outgoing, outcomes have incoming
    nodeTotals.set(n.id, Math.max(outgoing, incoming))
  }

  return {
    chart: {
      backgroundColor: 'transparent',
      animation: false,
      style: { fontFamily: CHART_FONT_FAMILY },
    },
    title: { text: undefined },
    credits: { enabled: false },
    tooltip: {
      useHTML: true,
      formatter(this: Highcharts.Point): string {
        const point = this as unknown as Record<string, unknown>

        // Link tooltip: show MWh and % of source
        if (point.fromNode && point.toNode) {
          const fromNode = point.fromNode as { id: string; name: string }
          const toNode = point.toNode as { id: string; name: string }
          const weight = (point.weight as number) ?? 0
          const sourceTotal = nodeTotals.get(fromNode.id) ?? weight
          const pct = sourceTotal > 0 ? (weight / sourceTotal) * 100 : 0
          return `${fromNode.name} → ${toNode.name}: <b>${Math.round(weight).toLocaleString()} MWh</b> (${pct.toFixed(1)}% of ${fromNode.name})`
        }

        // Node tooltip: show total MWh
        const name = (point.name as string) ?? ''
        const nodeId = (point.id as string) ?? ''
        const total = nodeTotals.get(nodeId) ?? 0
        return `<b>${name}</b>: ${Math.round(total).toLocaleString()} MWh`
      },
      style: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '12px',
      },
    } as Highcharts.TooltipOptions,
    series: [
      {
        type: 'sankey' as const,
        name: 'Energy flows',
        keys: ['from', 'to', 'weight'],
        data,
        nodes: nodeMap,
        dataLabels: {
          enabled: true,
          nodeFormat: '{point.name}',
          style: {
            fontFamily: CHART_FONT_FAMILY,
            fontSize: '11px',
            fontWeight: '500',
            color: NEUTRAL_1000,
            textOutline: 'none',
          },
          /* Place labels outside small nodes rather than hiding them */
          crop: false,
          overflow: 'allow' as Highcharts.DataLabelsOverflowValue,
        } as Highcharts.SeriesSankeyDataLabelsOptionsObject,
        linkOpacity: 0.5,
        nodeWidth: 20,
        nodePadding: 12,
        minLinkWidth: 1,
      } as Highcharts.SeriesSankeyOptions,
    ],
    plotOptions: {
      series: { animation: false },
    },
  }
}
