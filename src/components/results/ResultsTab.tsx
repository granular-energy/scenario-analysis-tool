/**
 * Results tab — the main container that composes tiles, selector, and five charts.
 * All data comes from the memoised engineResult in PortfolioContext.
 * The consumer selector is local UI state — switching it does not re-run the engine.
 */

import { useMemo, useState } from 'react'

import type { ConsumerResult, EngineResult, MatchingSummary } from '../../engine/types'
import { usePortfolioContext } from '../../state/usePortfolioContext'
import { ConsumerSelector } from './ConsumerSelector'
import { ScoreTile } from './ScoreTile'
import { Chart } from './Chart'
import { granularityLabel } from './granularityLabel'

import { buildAverageDayConfig, type AverageDayInput } from './charts/averageDayConfig'
import { buildHeatmapConfig } from './charts/heatmapConfig'
import { buildMonthlyBreakdownConfig, type MonthlyBreakdownInput } from './charts/monthlyBreakdownConfig'
import {
  buildExampleDayConfig,
  DEFAULT_DAY_INDEX,
  dateToDayIndex,
  dayIndexToDate,
  type ExampleDayInput,
} from './charts/exampleDayConfig'
import { buildPortfolioSankey, buildConsumerSankey, buildSankeyChartConfig } from './charts/sankeyConfig'

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

interface AggregatedGen {
  generatorId: string
  allocatedMWh: readonly number[]
  matchedMWh: readonly number[]
  monthlyAllocatedMWh: readonly number[]
  monthlyMatchedMWh: readonly number[]
  totalAllocatedMWh: number
  totalMatchedMWh: number
}

/** Aggregate generator contributions across consumers for the portfolio view. */
function aggregatePortfolioGenerators(result: EngineResult): readonly AggregatedGen[] {
  const genMap = new Map<
    string,
    {
      allocatedMWh: number[]
      matchedMWh: number[]
      monthlyAllocatedMWh: number[]
      monthlyMatchedMWh: number[]
      totalAllocatedMWh: number
      totalMatchedMWh: number
    }
  >()

  for (const consumer of result.consumers) {
    for (const gen of consumer.generators) {
      const existing = genMap.get(gen.generatorId)
      if (existing) {
        for (let i = 0; i < 8760; i++) {
          existing.allocatedMWh[i] += gen.allocatedMWh[i]
          existing.matchedMWh[i] += gen.matchedMWh[i]
        }
        for (let m = 0; m < 12; m++) {
          existing.monthlyAllocatedMWh[m] += gen.monthlyAllocatedMWh[m]
          existing.monthlyMatchedMWh[m] += gen.monthlyMatchedMWh[m]
        }
        existing.totalAllocatedMWh += gen.totalAllocatedMWh
        existing.totalMatchedMWh += gen.totalMatchedMWh
      } else {
        genMap.set(gen.generatorId, {
          allocatedMWh: [...gen.allocatedMWh],
          matchedMWh: [...gen.matchedMWh],
          monthlyAllocatedMWh: [...gen.monthlyAllocatedMWh],
          monthlyMatchedMWh: [...gen.monthlyMatchedMWh],
          totalAllocatedMWh: gen.totalAllocatedMWh,
          totalMatchedMWh: gen.totalMatchedMWh,
        })
      }
    }
  }

  return Array.from(genMap.entries()).map(([generatorId, data]) => ({
    generatorId,
    ...data,
  }))
}

/** Resolve which summary and generators to display for the current consumer selection. */
function resolveView(
  result: EngineResult,
  selectedConsumerId: string | null,
): {
  summary: MatchingSummary
  consumerResult: ConsumerResult | null
} {
  if (!selectedConsumerId) {
    return { summary: result.portfolio, consumerResult: null }
  }
  const consumer = result.consumers.find((c) => c.consumerId === selectedConsumerId)
  return {
    summary: consumer ?? result.portfolio,
    consumerResult: consumer ?? null,
  }
}

export function ResultsTab() {
  const { state, engineResult } = usePortfolioContext()
  const [selectedConsumerId, setSelectedConsumerId] = useState<string | null>(null)
  const [dayIndex, setDayIndex] = useState(DEFAULT_DAY_INDEX)

  // Build lookup maps from portfolio state — stable across consumer selector changes
  const { technologyMap, generatorNameMap, consumerNameMap } = useMemo(() => {
    const techMap = new Map<string, string>()
    const genNameMap = new Map<string, string>()
    for (const g of state.generators) {
      techMap.set(g.uid, g.technology)
      genNameMap.set(g.uid, g.name)
    }
    const conNameMap = new Map<string, string>()
    for (const c of state.consumers) {
      conNameMap.set(c.uid, c.name)
    }
    return { technologyMap: techMap, generatorNameMap: genNameMap, consumerNameMap: conNameMap }
  }, [state.generators, state.consumers])

  // Resolve current view data — always called, never conditional
  const { summary, consumerResult } = useMemo(
    () =>
      engineResult ? resolveView(engineResult, selectedConsumerId) : { summary: null, consumerResult: null },
    [engineResult, selectedConsumerId],
  )

  // Deduplicate generators for portfolio view — aggregate by generatorId
  const aggregatedGenerators: readonly AggregatedGen[] = useMemo(() => {
    if (!engineResult) return []
    if (consumerResult) return consumerResult.generators
    return aggregatePortfolioGenerators(engineResult)
  }, [engineResult, consumerResult])

  // Chart 1 — Average day
  const avgDayConfig = useMemo(() => {
    if (!summary) return null
    const input: AverageDayInput = {
      demandMWh: summary.demandMWh,
      unmatchedMWh: summary.unmatchedMWh,
      generators: aggregatedGenerators.map((g) => ({
        name: generatorNameMap.get(g.generatorId) ?? g.generatorId,
        technology: technologyMap.get(g.generatorId) ?? 'unknown',
        allocatedMWh: g.allocatedMWh,
      })),
    }
    return buildAverageDayConfig(input)
  }, [summary, aggregatedGenerators, generatorNameMap, technologyMap])

  // Chart 2 — Heatmap
  const heatmapConfig = useMemo(() => (summary ? buildHeatmapConfig(summary) : null), [summary])

  // Chart 3 — Monthly breakdown
  const monthlyConfig = useMemo(() => {
    if (!summary) return null
    const input: MonthlyBreakdownInput = {
      monthlyScores: summary.monthlyScores,
      monthlyUnmatchedMWh: summary.monthlyUnmatchedMWh,
      generators: aggregatedGenerators.map((g) => ({
        name: generatorNameMap.get(g.generatorId) ?? g.generatorId,
        technology: technologyMap.get(g.generatorId) ?? 'unknown',
        monthlyMatchedMWh: g.monthlyMatchedMWh,
        monthlyExcessMWh: g.monthlyAllocatedMWh.map((a: number, i: number) =>
          Math.max(0, a - g.monthlyMatchedMWh[i]),
        ),
      })),
    }
    return buildMonthlyBreakdownConfig(input)
  }, [summary, aggregatedGenerators, generatorNameMap, technologyMap])

  // Chart 4 — Example day
  const exampleDayConfig = useMemo(() => {
    if (!summary) return null
    const input: ExampleDayInput = {
      dayIndex,
      demandMWh: summary.demandMWh,
      unmatchedMWh: summary.unmatchedMWh,
      generators: aggregatedGenerators.map((g) => ({
        name: generatorNameMap.get(g.generatorId) ?? g.generatorId,
        technology: technologyMap.get(g.generatorId) ?? 'unknown',
        allocatedMWh: g.allocatedMWh,
      })),
    }
    return buildExampleDayConfig(input)
  }, [summary, aggregatedGenerators, generatorNameMap, technologyMap, dayIndex])

  // Chart 5 — Sankey
  const sankeyConfig = useMemo(() => {
    if (!engineResult) return null
    if (consumerResult) {
      const input = buildConsumerSankey(
        consumerResult,
        engineResult.generators,
        generatorNameMap,
        consumerNameMap,
        technologyMap,
      )
      return buildSankeyChartConfig(input)
    }
    const input = buildPortfolioSankey(engineResult, generatorNameMap, consumerNameMap, technologyMap)
    return buildSankeyChartConfig(input)
  }, [engineResult, consumerResult, generatorNameMap, consumerNameMap, technologyMap])

  // Empty state: no engine result — checked AFTER all hooks
  if (!engineResult || !summary) {
    return (
      <div className="results-empty" data-testid="results-empty">
        <div className="results-empty__card">
          <p className="results-empty__text">
            No results to display. Set allocation percentages on the Allocation tab to see matching results.
          </p>
        </div>
      </div>
    )
  }

  // Day picker date string
  const dayDate = dayIndexToDate(dayIndex)
  const dateValue = `2024-${String(dayDate.month).padStart(2, '0')}-${String(dayDate.day).padStart(2, '0')}`

  const handleDateChange = (value: string) => {
    const parts = value.split('-')
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10)
      const day = parseInt(parts[2], 10)
      if (month >= 1 && month <= 12 && day >= 1) {
        const newIndex = dateToDayIndex(month, day)
        if (newIndex >= 0 && newIndex < 365) {
          setDayIndex(newIndex)
        }
      }
    }
  }

  const consumerOptions = state.consumers.map((c) => ({ id: c.uid, name: c.name }))

  return (
    <div className="results-tab" data-testid="results-tab">
      {/* Header: granularity + consumer selector */}
      <div className="results-tab__header">
        <p className="results-tab__granularity" data-testid="results-granularity">
          {granularityLabel(engineResult.granularity)}
        </p>
        <ConsumerSelector
          consumers={consumerOptions}
          selectedId={selectedConsumerId}
          onChange={setSelectedConsumerId}
        />
      </div>

      {/* Score tiles */}
      <div className="results-tab__tiles" data-testid="results-tiles">
        <ScoreTile
          label="Hourly matching score"
          value={summary.hourlyScore.toFixed(2)}
          unit="%"
          accent
          tooltip="The percentage of demand met by generation in the same hour. This is the strictest measure of temporal matching — generation must occur in the exact same hour as consumption to count."
          testId="tile-hourly-score"
        />
        <ScoreTile
          label="Annual (volumetric)"
          value={summary.annualScore.toFixed(2)}
          unit="%"
          tooltip="The percentage of annual demand covered by the total allocated generation volume. Unlike the hourly score, this does not require generation and demand to occur at the same time — it only compares totals."
          testId="tile-annual-score"
        />
        <ScoreTile
          label="Excess"
          value={formatNumber(Math.round(summary.totalExcessMWh))}
          unit="MWh"
          tooltip="Energy generated and allocated but not consumed because it arrived in hours when demand was already met. At hourly granularity this is always zero because allocation never exceeds demand in any single hour."
          testId="tile-excess"
        />
        <ScoreTile
          label="Unmatched demand"
          value={formatNumber(Math.round(summary.totalUnmatchedMWh))}
          unit="MWh"
          tooltip="Demand that was not covered by any allocated generation. This is the gap between total demand and matched energy."
          testId="tile-unmatched"
        />
      </div>

      {/* Chart 1 — Average 24-hour profile */}
      {avgDayConfig && (
        <div className="results-tab__chart-card content-card" data-testid="chart-average-day">
          <h3 className="results-tab__chart-title">Average 24-hour profile</h3>
          <Chart options={avgDayConfig} />
        </div>
      )}

      {/* Chart 2 — Hourly matching heatmap */}
      {heatmapConfig && (
        <div className="results-tab__chart-card content-card" data-testid="chart-heatmap">
          <h3 className="results-tab__chart-title">Hourly matching heatmap</h3>
          <Chart options={heatmapConfig} />
        </div>
      )}

      {/* Chart 3 — Monthly breakdown */}
      {monthlyConfig && (
        <div className="results-tab__chart-card content-card" data-testid="chart-monthly">
          <h3 className="results-tab__chart-title">Monthly breakdown</h3>
          <Chart options={monthlyConfig} />
        </div>
      )}

      {/* Chart 4 — Example day */}
      {exampleDayConfig && (
        <div className="results-tab__chart-card content-card" data-testid="chart-example-day">
          <h3 className="results-tab__chart-title">Example day</h3>
          <div className="results-tab__day-picker">
            <label className="results-tab__day-picker-label" htmlFor="day-picker">
              Select date:
            </label>
            <input
              id="day-picker"
              type="date"
              className="results-tab__day-picker-input"
              value={dateValue}
              min="2024-01-01"
              max="2024-12-30"
              data-testid="day-picker"
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
          <Chart options={exampleDayConfig} />
        </div>
      )}

      {/* Chart 5 — Sankey */}
      {sankeyConfig && (
        <div
          className="results-tab__chart-card content-card results-tab__sankey-container"
          data-testid="chart-sankey"
        >
          <h3 className="results-tab__chart-title">Energy flow</h3>
          <div className="results-tab__sankey-scroll">
            <Chart options={sankeyConfig} />
          </div>
        </div>
      )}
    </div>
  )
}
