/**
 * CompareColumns: renders a row of tile columns, one per selected scenario.
 * Each column shows: scenario name, hourly score, annual score, excess MWh, unmatched MWh.
 * Uses the saved ScenarioResultsSummary directly (no re-computation needed here).
 */

import type { SavedScenario } from '../../io/scenarioIO'

/** Series colours for up to 4 scenarios, matching --ge-series-1..4 in tokens.css. */
const SERIES_COLOURS = ['#00988b', '#e9a23b', '#0f4974', '#ab80cc'] as const

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

interface CompareColumnsProps {
  readonly scenarios: readonly SavedScenario[]
}

export function CompareColumns({ scenarios }: CompareColumnsProps) {
  return (
    <div className="compare-columns" data-testid="compare-columns">
      {scenarios.map((scenario, idx) => (
        <div
          key={scenario.id}
          className="compare-column"
          style={{ borderTopColor: SERIES_COLOURS[idx % SERIES_COLOURS.length] }}
        >
          <h3 className="compare-column__name">{scenario.name}</h3>
          <div className="compare-column__tiles">
            <div className="compare-column__tile">
              <span className="compare-column__tile-label">Hourly score</span>
              <span className="compare-column__tile-value compare-column__tile-value--accent">
                {scenario.results.hourlyScore.toFixed(2)}
                <span className="compare-column__tile-unit">%</span>
              </span>
            </div>
            <div className="compare-column__tile">
              <span className="compare-column__tile-label">Annual (volumetric)</span>
              <span className="compare-column__tile-value">
                {scenario.results.annualScore.toFixed(2)}
                <span className="compare-column__tile-unit">%</span>
              </span>
            </div>
            <div className="compare-column__tile">
              <span className="compare-column__tile-label">Excess</span>
              <span className="compare-column__tile-value">
                {formatNumber(Math.round(scenario.results.totalExcessMWh))}
                <span className="compare-column__tile-unit">MWh</span>
              </span>
            </div>
            <div className="compare-column__tile">
              <span className="compare-column__tile-label">Unmatched demand</span>
              <span className="compare-column__tile-value">
                {formatNumber(Math.round(scenario.results.totalUnmatchedMWh))}
                <span className="compare-column__tile-unit">MWh</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
