/**
 * ConsumerScoreTable: shows per-consumer hourly and annual scores for each selected scenario.
 * Re-runs the engine for each scenario to get per-consumer results, using useMemo for performance.
 */

import { Fragment, useMemo } from 'react'
import { runEngine } from '../../engine'
import type { Consumer, ConsumerResult, Generator } from '../../engine/types'
import type { SavedScenario } from '../../io/scenarioIO'
import type { PortfolioConsumer, PortfolioGenerator } from '../../state/portfolioTypes'

function scaleConsumer(c: PortfolioConsumer): Consumer {
  const total = c.shape.reduce((a, b) => a + b, 0)
  const demandMWh = total > 0 ? c.shape.map((v) => (v / total) * c.annualMWh) : c.shape.map(() => 0)
  return { id: c.uid, demandMWh }
}

function scaleGenerator(g: PortfolioGenerator): Generator {
  const total = g.shape.reduce((a, b) => a + b, 0)
  const generationMWh = total > 0 ? g.shape.map((v) => (v / total) * g.annualMWh) : g.shape.map(() => 0)
  return { id: g.uid, generationMWh }
}

interface ScenarioConsumerScores {
  readonly scenarioId: string
  readonly consumers: readonly ConsumerResult[]
}

interface ConsumerScoreTableProps {
  readonly scenarios: readonly SavedScenario[]
}

export function ConsumerScoreTable({ scenarios }: ConsumerScoreTableProps) {
  // Re-run the engine for each scenario to get per-consumer results
  const scenarioResults: readonly ScenarioConsumerScores[] = useMemo(() => {
    return scenarios.map((scenario) => {
      const consumers = scenario.portfolio.consumers.map(scaleConsumer)
      const generators = scenario.portfolio.generators.map(scaleGenerator)

      // Check if any generator has a non-zero allocation
      const hasAllocation = scenario.portfolio.generators.some((g) => {
        const row = scenario.portfolio.matrix[g.uid]
        return row && Object.values(row).some((v) => v > 0)
      })

      if (!hasAllocation || consumers.length === 0 || generators.length === 0) {
        return { scenarioId: scenario.id, consumers: [] }
      }

      const result = runEngine({
        consumers,
        generators,
        matrix: scenario.portfolio.matrix,
        granularity: scenario.portfolio.granularity,
      })

      return { scenarioId: scenario.id, consumers: result.consumers }
    })
  }, [scenarios])

  // Build a union of all consumer IDs and names across all scenarios
  const allConsumers = useMemo(() => {
    const seen = new Map<string, string>()
    for (const scenario of scenarios) {
      for (const c of scenario.portfolio.consumers) {
        if (!seen.has(c.uid)) {
          seen.set(c.uid, c.name)
        }
      }
    }
    return Array.from(seen.entries()).map(([uid, name]) => ({ uid, name }))
  }, [scenarios])

  return (
    <div className="content-card" data-testid="consumer-score-table">
      <h3 className="compare-section-title">Per-consumer scores</h3>
      <div className="matrix-scroll">
        <table className="assumptions-table">
          <thead>
            <tr>
              <th className="assumptions-table__corner">Consumer</th>
              {scenarios.map((s) => (
                <th key={s.id} className="assumptions-table__col-header" colSpan={2}>
                  {s.name}
                </th>
              ))}
            </tr>
            <tr>
              <th className="assumptions-table__corner"></th>
              {scenarios.map((s) => (
                <Fragment key={s.id}>
                  <th className="assumptions-table__sub-header">Hourly</th>
                  <th className="assumptions-table__sub-header">Annual</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {allConsumers.map((consumer) => (
              <tr key={consumer.uid}>
                <td className="assumptions-table__row-header">{consumer.name}</td>
                {scenarioResults.map((sr) => {
                  const cr = sr.consumers.find((c) => c.consumerId === consumer.uid)
                  return (
                    <Fragment key={sr.scenarioId}>
                      <td className="assumptions-table__cell">
                        {cr ? `${cr.hourlyScore.toFixed(2)} %` : '--'}
                      </td>
                      <td className="assumptions-table__cell">
                        {cr ? `${cr.annualScore.toFixed(2)} %` : '--'}
                      </td>
                    </Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
