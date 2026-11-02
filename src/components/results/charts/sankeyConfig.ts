/**
 * Chart 5 — Sankey diagram.
 * Flows from each generator to each consumer (allocated MWh),
 * then from each consumer to "Matched" and "Excess",
 * plus from each generator to "Unallocated" for unused generation.
 */

import type Highcharts from 'highcharts'
import type { ConsumerResult, EngineResult, GeneratorUtilisation } from '../../../engine/types'
import {
  CHART_FONT_FAMILY,
  DEMAND_COLOUR,
  EXCESS_COLOUR,
  MATCHED_COLOUR,
  UNALLOCATED_STRIPE,
  techAllocatedColour,
} from './palette'

export interface SankeyNode {
  id: string
  name: string
  color: string
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

/** Build Sankey data for the whole portfolio view. */
export function buildPortfolioSankey(
  result: EngineResult,
  generatorNames: ReadonlyMap<string, string>,
  consumerNames: ReadonlyMap<string, string>,
  technologyMap: ReadonlyMap<string, string>,
): SankeyInput {
  const nodes: SankeyNode[] = []
  const links: SankeyLink[] = []

  // Generator nodes
  for (const gen of result.generators) {
    const tech = technologyMap.get(gen.generatorId) ?? 'unknown'
    nodes.push({
      id: `gen-${gen.generatorId}`,
      name: generatorNames.get(gen.generatorId) ?? gen.generatorId,
      color: techAllocatedColour(tech),
    })
  }

  // Consumer nodes
  for (const consumer of result.consumers) {
    nodes.push({
      id: `con-${consumer.consumerId}`,
      name: consumerNames.get(consumer.consumerId) ?? consumer.consumerId,
      color: DEMAND_COLOUR,
    })
  }

  // Destination nodes
  nodes.push({ id: 'matched', name: 'Matched', color: MATCHED_COLOUR })
  nodes.push({ id: 'unallocated', name: 'Unallocated', color: UNALLOCATED_STRIPE })

  // Only add excess node if there is any excess
  const totalExcess = result.consumers.reduce((sum, c) => sum + c.totalExcessMWh, 0)
  if (totalExcess > 0.01) {
    nodes.push({ id: 'excess', name: 'Excess', color: EXCESS_COLOUR })
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

  // Generator → Unallocated links
  for (const gen of result.generators) {
    if (gen.unallocatedMWh > 0.01) {
      links.push({
        from: `gen-${gen.generatorId}`,
        to: 'unallocated',
        weight: Math.round(gen.unallocatedMWh * 100) / 100,
        color: UNALLOCATED_STRIPE,
      })
    }
  }

  return { nodes, links }
}

/** Build Sankey data for a single consumer view. */
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

  for (const gen of relevantGens) {
    const tech = technologyMap.get(gen.generatorId) ?? 'unknown'
    nodes.push({
      id: `gen-${gen.generatorId}`,
      name: generatorNames.get(gen.generatorId) ?? gen.generatorId,
      color: techAllocatedColour(tech),
    })
  }

  nodes.push({
    id: `con-${consumer.consumerId}`,
    name: consumerName,
    color: DEMAND_COLOUR,
  })

  nodes.push({ id: 'matched', name: 'Matched', color: MATCHED_COLOUR })

  if (consumer.totalExcessMWh > 0.01) {
    nodes.push({ id: 'excess', name: 'Excess', color: EXCESS_COLOUR })
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

  // Generator → Unallocated (show the full generator's unallocated, not just this consumer's share)
  for (const gen of relevantGens) {
    if (gen.unallocatedMWh > 0.01) {
      // Only add unallocated node once
      if (!nodes.some((n) => n.id === 'unallocated')) {
        nodes.push({ id: 'unallocated', name: 'Unallocated', color: UNALLOCATED_STRIPE })
      }
      links.push({
        from: `gen-${gen.generatorId}`,
        to: 'unallocated',
        weight: Math.round(gen.unallocatedMWh * 100) / 100,
        color: UNALLOCATED_STRIPE,
      })
    }
  }

  return { nodes, links }
}

export function buildSankeyChartConfig(input: SankeyInput): Highcharts.Options {
  const nodeMap = input.nodes.map((n) => ({
    id: n.id,
    name: n.name,
    color: n.color,
  }))

  const data = input.links.map((l) => [l.from, l.to, l.weight])

  return {
    chart: {
      backgroundColor: 'transparent',
      animation: false,
      style: { fontFamily: CHART_FONT_FAMILY },
    },
    title: { text: undefined },
    credits: { enabled: false },
    tooltip: {
      headerFormat: '',
      pointFormat: '{point.fromNode.name} \u2192 {point.toNode.name}: <b>{point.weight:.0f} MWh</b>',
      style: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: '12px',
      },
    },
    series: [
      {
        type: 'sankey' as const,
        name: 'Energy flows',
        keys: ['from', 'to', 'weight'],
        data,
        nodes: nodeMap,
        dataLabels: {
          enabled: true,
          style: {
            fontFamily: CHART_FONT_FAMILY,
            fontSize: '11px',
            fontWeight: '500',
            color: '#2A2929',
            textOutline: 'none',
          },
        },
        nodeWidth: 20,
      },
    ],
    plotOptions: {
      series: { animation: false },
    },
  }
}
