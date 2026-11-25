/**
 * ConsumerScoreTable: shows per-consumer hourly and annual scores for each selected scenario.
 * Re-runs the engine for each scenario to get per-consumer results, using useMemo for performance.
 */

import { Fragment, useMemo } from 'react'
import type { ConsumerResult } from '../../engine/types'
import type { SavedScenario } from '../../io/scenarioIO'
import { runPortfolioEngine } from '../../state/runPortfolioEngine'

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
    return scenarios.map((scenario) => ({
      scenarioId: scenario.id,
      consumers: runPortfolioEngine(scenario.portfolio)?.consumers ?? [],
    }))
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
