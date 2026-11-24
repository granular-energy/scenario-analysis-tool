/**
 * Results tab — the main container that composes tiles, selector, and five charts.
 * All data comes from the memoised engineResult in PortfolioContext.
 * The consumer selector is local UI state — switching it does not re-run the engine.
 */

import { useCallback, useMemo, useState } from 'react'

import type { ConsumerResult, EngineResult, MatchingSummary } from '../../engine/types'
import { generateId, createScenarioResultsSummary, exportScenarioFile } from '../../io/scenarioIO'
import type { SavedScenario } from '../../io/scenarioIO'
import { addScenario, loadScenarios } from '../../state/scenarioStore'
import { usePortfolioContext } from '../../state/usePortfolioContext'
import { generateSingleScenarioPdf } from '../report/pdfReport'
import { ConsumerSelector } from './ConsumerSelector'
import { ScoreTile } from './ScoreTile'
import { Chart } from './Chart'
import { granularityInfo, SHAPE_PRESERVED_TOOLTIP } from './granularityLabel'

import { buildAverageDayConfig, type AverageDayInput } from './charts/averageDayConfig'
import { buildHeatmapConfig } from './charts/heatmapConfig'
import { buildMonthlyBreakdownConfig, type MonthlyBreakdownInput } from './charts/monthlyBreakdownConfig'
import {
  buildExampleDayConfig,
  DEFAULT_DAY_INDEX,
  dayIndexToDate,
  type ExampleDayInput,
} from './charts/exampleDayConfig'
import { buildPortfolioSankey, buildConsumerSankey, buildSankeyChartConfig } from './charts/sankeyConfig'

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Build the options for the example-day picker: all 365 days as "d Month". */
function buildDayOptions(): { label: string; dayIndex: number }[] {
  const options: { label: string; dayIndex: number }[] = []
  let idx = 0
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
      options.push({ label: `${d} ${MONTH_LABELS[m]}`, dayIndex: idx })
      idx++
    }
  }
  return options
}

const DAY_OPTIONS = buildDayOptions()

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

/** Compute per-generator hourly excess: excess(h) = allocated(h) - matched(h), floored at 0. */
function computeHourlyExcess(allocatedMWh: readonly number[], matchedMWh: readonly number[]): number[] {
  const excess = new Array<number>(8760)
  for (let i = 0; i < 8760; i++) {
    const raw = allocatedMWh[i] - matchedMWh[i]
    excess[i] = raw < 0 ? 0 : raw
  }
  return excess
}

/** Trigger a browser download of a JSON object as a file. */
function downloadJsonFile(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ResultsTab() {
  const { state, dispatch, engineResult } = usePortfolioContext()
  const [selectedConsumerId, setSelectedConsumerId] = useState<string | null>(null)
  const [dayIndex, setDayIndex] = useState(DEFAULT_DAY_INDEX)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [loadOpen, setLoadOpen] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<readonly SavedScenario[]>([])

  /** Save the current portfolio and results as a named scenario in localStorage. */
  const handleSave = useCallback(() => {
    if (!engineResult) return
    const existing = loadScenarios()
    const defaultName = `Scenario ${existing.length + 1}`
    const name = window.prompt('Scenario name:', defaultName)
    if (!name) return
    const scenario: SavedScenario = {
      id: generateId(),
      name,
      savedAt: new Date().toISOString(),
      portfolio: state,
      results: createScenarioResultsSummary(engineResult),
    }
    addScenario(scenario)
    setSaveMsg(`Saved "${name}"`)
    setTimeout(() => setSaveMsg(null), 2000)
  }, [engineResult, state])

  /** Download the current portfolio as a self-contained JSON file. */
  const handleDownloadJson = useCallback(() => {
    if (!engineResult) return
    const existing = loadScenarios()
    const defaultName = `Scenario ${existing.length + 1}`
    const file = exportScenarioFile(defaultName, state)
    const safeName = defaultName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    downloadJsonFile(file, `${safeName}.json`)
  }, [engineResult, state])

  /** Download a PDF report. Wrapped so a gate can be added later. */
  const handleDownloadReport = useCallback(() => {
    if (!engineResult) return
    const name = 'Scenario report'
    void generateSingleScenarioPdf(name, state, engineResult)
  }, [engineResult, state])

  /** Open the load dropdown, refreshing the list from localStorage. */
  const handleLoadOpen = useCallback(() => {
    setSavedScenarios(loadScenarios())
    setLoadOpen((prev) => !prev)
  }, [])

  /** Load a saved scenario into the current portfolio. */
  const handleLoadScenario = useCallback(
    (scenario: SavedScenario) => {
      dispatch({ type: 'LOAD_STATE', state: scenario.portfolio })
      setLoadOpen(false)
    },
    [dispatch],
  )

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
    return {
      technologyMap: techMap,
      generatorNameMap: genNameMap,
      consumerNameMap: conNameMap,
    }
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

  // Pre-compute per-generator excess series (used in avg day, example day, monthly)
  const generatorExcessSeries = useMemo(() => {
    return aggregatedGenerators.map((g) => ({
      generatorId: g.generatorId,
      excessMWh: computeHourlyExcess(g.allocatedMWh, g.matchedMWh),
    }))
  }, [aggregatedGenerators])

  // Chart 1 — Average day
  const avgDayConfig = useMemo(() => {
    if (!summary) return null
    const input: AverageDayInput = {
      demandMWh: summary.demandMWh,
      unmatchedMWh: summary.unmatchedMWh,
      generators: aggregatedGenerators.map((g, i) => ({
        name: generatorNameMap.get(g.generatorId) ?? g.generatorId,
        technology: technologyMap.get(g.generatorId) ?? 'unknown',
        matchedMWh: g.matchedMWh,
        excessMWh: generatorExcessSeries[i].excessMWh,
      })),
    }
    return buildAverageDayConfig(input)
  }, [summary, aggregatedGenerators, generatorExcessSeries, generatorNameMap, technologyMap])

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
        monthlyExcessMWh: g.monthlyAllocatedMWh.map((a: number, i: number) => {
          const raw = a - g.monthlyMatchedMWh[i]
          // Suppress floating-point noise — values below 0.01 MWh are treated as zero
          return raw < 0.01 ? 0 : raw
        }),
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
      generators: aggregatedGenerators.map((g, i) => ({
        name: generatorNameMap.get(g.generatorId) ?? g.generatorId,
        technology: technologyMap.get(g.generatorId) ?? 'unknown',
        matchedMWh: g.matchedMWh,
        excessMWh: generatorExcessSeries[i].excessMWh,
      })),
    }
    return buildExampleDayConfig(input)
  }, [summary, aggregatedGenerators, generatorExcessSeries, generatorNameMap, technologyMap, dayIndex])

  // Chart 5 — Sankey (use a stable key to force re-creation on consumer change)
  const sankeyKey = selectedConsumerId ?? '__portfolio__'
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

  // Day picker label (day and month only, no year)
  const dayDate = dayIndexToDate(dayIndex)
  const dayLabel = `${dayDate.day} ${MONTH_LABELS[dayDate.month - 1]}`

  const consumerOptions = state.consumers.map((c) => ({ id: c.uid, name: c.name }))

  return (
    <div className="results-tab" data-testid="results-tab">
      {/* Header: granularity + consumer selector */}
      <div className="results-tab__header">
        <p className="results-tab__granularity" data-testid="results-granularity">
          {(() => {
            const info = granularityInfo(engineResult.granularity)
            const hasShapeTip = info.shapeRule === 'generator shape preserved'
            return (
              <>
                {info.label} &middot; {info.capRule} &middot;{' '}
                {hasShapeTip ? (
                  <abbr
                    className="results-tab__shape-tip"
                    title={SHAPE_PRESERVED_TOOLTIP}
                    aria-label="Shape preserved: a generator's allocation follows its own hourly output shape and is not redistributed into other hours."
                  >
                    {info.shapeRule}
                  </abbr>
                ) : (
                  info.shapeRule
                )}
              </>
            )
          })()}
        </p>
        <ConsumerSelector
          consumers={consumerOptions}
          selectedId={selectedConsumerId}
          onChange={setSelectedConsumerId}
        />
      </div>

      {/* Action bar: save, download, load */}
      <div className="results-tab__actions" data-testid="results-actions">
        <button className="btn-primary" data-testid="save-scenario-btn" onClick={handleSave}>
          Save scenario
        </button>
        <button className="btn-secondary" data-testid="download-scenario-btn" onClick={handleDownloadJson}>
          Download scenario
        </button>
        <button className="btn-secondary" data-testid="download-report-btn" onClick={handleDownloadReport}>
          Download report
        </button>
        <div className="results-tab__load-wrapper">
          <button className="btn-secondary" data-testid="load-scenario-btn" onClick={handleLoadOpen}>
            Load scenario
          </button>
          {loadOpen && savedScenarios.length > 0 && (
            <ul className="results-tab__load-dropdown" data-testid="load-scenario-list">
              {savedScenarios.map((s) => (
                <li key={s.id}>
                  <button
                    className="results-tab__load-item"
                    data-testid={`load-scenario-${s.id}`}
                    onClick={() => handleLoadScenario(s)}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loadOpen && savedScenarios.length === 0 && (
            <div
              className="results-tab__load-dropdown results-tab__load-empty"
              data-testid="load-scenario-empty"
            >
              No saved scenarios
            </div>
          )}
        </div>
        {saveMsg && (
          <span className="results-tab__save-msg" data-testid="save-confirmation">
            {saveMsg}
          </span>
        )}
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
          tooltip="Annual generation assigned to this consumer as a percentage of its annual demand. It compares volumes only, ignoring timing and the matching method, so equal annual generation and consumption reads 100 %."
          testId="tile-annual-score"
        />
        <ScoreTile
          label="Excess"
          value={formatNumber(Math.round(summary.totalExcessMWh))}
          unit="MWh"
          tooltip="Generation allocated to a consumer that arrived in hours when its demand was already met. It counts towards the annual score but not the hourly score. Different from surplus generation, which is never allocated at all. Always zero with hourly matching only."
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
          <h3 className="results-tab__chart-title">Example day — {dayLabel}</h3>
          <div className="results-tab__day-picker">
            <label className="results-tab__day-picker-label" htmlFor="day-picker">
              Select day:
            </label>
            <select
              id="day-picker"
              className="results-tab__day-picker-input"
              value={dayIndex}
              data-testid="day-picker"
              onChange={(e) => setDayIndex(Number(e.target.value))}
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.dayIndex} value={opt.dayIndex}>
                  {opt.label}
                </option>
              ))}
            </select>
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
          <p className="results-tab__sankey-note" data-testid="sankey-outcomes-note">
            <strong>Matched</strong> is allocated generation consumed in the same hour.{' '}
            <strong>Excess</strong> is allocated to a consumer but arrives in an hour where its demand is
            already covered, so it counts towards the annual score but not the hourly score.{' '}
            <strong>Surplus generation</strong> never reaches a consumer: the matching cap or the allocation
            matrix left it unassigned.
          </p>
          {consumerResult && (
            <p className="results-tab__sankey-note" data-testid="sankey-surplus-note">
              Surplus generation is a portfolio-level concept and is not shown in the per-consumer view.
            </p>
          )}
          <div className="results-tab__sankey-scroll">
            <Chart key={sankeyKey} options={sankeyConfig} />
          </div>
        </div>
      )}
    </div>
  )
}
