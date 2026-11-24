/**
 * AssumptionsTable: shows an assumptions diff table comparing portfolios across scenarios.
 * Rows: consumer names (with annual MWh), generator names (with annual MWh), matrix %, allocation method.
 * Columns: one per selected scenario.
 * Cells that differ between scenarios get a highlight class.
 */

import type { SavedScenario } from '../../io/scenarioIO'
import { granularityLabel } from '../results/granularityLabel'

function formatMWh(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

/** Build a summary string for a scenario's consumers. */
function consumerSummary(scenario: SavedScenario): string {
  return scenario.portfolio.consumers.map((c) => `${c.name} -- ${formatMWh(c.annualMWh)} MWh`).join(', ')
}

/** Build a summary string for a scenario's generators. */
function generatorSummary(scenario: SavedScenario): string {
  return scenario.portfolio.generators.map((g) => `${g.name} -- ${formatMWh(g.annualMWh)} MWh`).join(', ')
}

/** Build a matrix summary showing each generator-consumer pair's percentage, using the active matrix for the mode. */
function matrixSummary(scenario: SavedScenario): string {
  const isConsumptionShare = scenario.portfolio.allocationMode === 'consumption-share'
  const activeMatrix = isConsumptionShare ? scenario.portfolio.consumptionMatrix : scenario.portfolio.matrix
  const suffix = isConsumptionShare ? '% of consumption' : '%'
  const parts: string[] = []
  for (const gen of scenario.portfolio.generators) {
    const row = activeMatrix[gen.uid]
    if (!row) continue
    for (const con of scenario.portfolio.consumers) {
      const pct = row[con.uid] ?? 0
      if (pct > 0) {
        parts.push(`${gen.name} -> ${con.name}: ${pct}${suffix}`)
      }
    }
  }
  return parts.length > 0 ? parts.join(', ') : 'None'
}

/** Human-readable label for the allocation mode. */
function allocationModeLabel(scenario: SavedScenario): string {
  return scenario.portfolio.allocationMode === 'consumption-share'
    ? 'Set % of consumption'
    : 'Share of generator output'
}

/** Check if all values in an array are identical. */
function allSame(values: readonly string[]): boolean {
  if (values.length === 0) return true
  return values.every((v) => v === values[0])
}

interface AssumptionsRow {
  readonly label: string
  readonly values: readonly string[]
  readonly differs: boolean
}

function buildRows(scenarios: readonly SavedScenario[]): AssumptionsRow[] {
  const consumerValues = scenarios.map(consumerSummary)
  const generatorValues = scenarios.map(generatorSummary)
  const matrixValues = scenarios.map(matrixSummary)
  const methodValues = scenarios.map((s) => granularityLabel(s.portfolio.granularity))
  const modeValues = scenarios.map(allocationModeLabel)

  return [
    { label: 'Allocation mode', values: modeValues, differs: !allSame(modeValues) },
    { label: 'Consumers', values: consumerValues, differs: !allSame(consumerValues) },
    { label: 'Generators', values: generatorValues, differs: !allSame(generatorValues) },
    { label: 'Matrix', values: matrixValues, differs: !allSame(matrixValues) },
    { label: 'Allocation method', values: methodValues, differs: !allSame(methodValues) },
  ]
}

interface AssumptionsTableProps {
  readonly scenarios: readonly SavedScenario[]
}

export function AssumptionsTable({ scenarios }: AssumptionsTableProps) {
  const rows = buildRows(scenarios)

  return (
    <div className="content-card" data-testid="assumptions-table">
      <h3 className="compare-section-title">Assumptions</h3>
      <div className="matrix-scroll">
        <table className="assumptions-table">
          <thead>
            <tr>
              <th className="assumptions-table__corner"></th>
              {scenarios.map((s) => (
                <th key={s.id} className="assumptions-table__col-header">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="assumptions-table__row-header">{row.label}</td>
                {row.values.map((val, idx) => (
                  <td
                    key={scenarios[idx].id}
                    className={
                      row.differs
                        ? 'assumptions-table__cell assumptions-table__cell--differs'
                        : 'assumptions-table__cell'
                    }
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
