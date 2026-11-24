/** Allocation matrix grid: generators as rows, consumers as columns. */

import { useCallback, useState } from 'react'
import { usePortfolioContext } from '../../state/usePortfolioContext'

type InputMode = 'percent' | 'mwh'

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

export function AllocationMatrix() {
  const { state, dispatch } = usePortfolioContext()
  const { consumers, generators, matrix, allocationMode, consumptionMatrix } = state
  const [inputMode, setInputMode] = useState<InputMode>('percent')
  const isConsumptionShare = allocationMode === 'consumption-share'
  const activeMatrix = isConsumptionShare ? consumptionMatrix : matrix

  const handlePercentChange = useCallback(
    (generatorUid: string, consumerUid: string, value: string) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return
      if (isConsumptionShare) {
        dispatch({ type: 'SET_CONSUMPTION_ALLOCATION', generatorUid, consumerUid, percent: parsed })
      } else {
        dispatch({ type: 'SET_ALLOCATION', generatorUid, consumerUid, percent: parsed })
      }
    },
    [dispatch, isConsumptionShare],
  )

  const handleMWhChange = useCallback(
    (generatorUid: string, consumerUid: string, mwhValue: string, denominator: number) => {
      const parsed = Number(mwhValue.replace(/[, ]/g, ''))
      if (!Number.isFinite(parsed) || denominator <= 0) return
      const percent = (parsed / denominator) * 100
      if (isConsumptionShare) {
        dispatch({ type: 'SET_CONSUMPTION_ALLOCATION', generatorUid, consumerUid, percent })
      } else {
        dispatch({ type: 'SET_ALLOCATION', generatorUid, consumerUid, percent })
      }
    },
    [dispatch, isConsumptionShare],
  )

  if (consumers.length === 0 || generators.length === 0) {
    return (
      <p className="allocation-empty">
        Add at least one consumer and one generator to configure allocations.
      </p>
    )
  }

  return (
    <div data-testid="allocation-matrix">
      <div className="matrix-mode-toggle" data-testid="matrix-mode-toggle">
        <span className="matrix-mode-toggle__label">Enter as:</span>
        <button
          className={`matrix-mode-toggle__btn ${inputMode === 'percent' ? 'matrix-mode-toggle__btn--active' : ''}`}
          onClick={() => setInputMode('percent')}
          data-testid="mode-percent"
        >
          %
        </button>
        <button
          className={`matrix-mode-toggle__btn ${inputMode === 'mwh' ? 'matrix-mode-toggle__btn--active' : ''}`}
          onClick={() => setInputMode('mwh')}
          data-testid="mode-mwh"
        >
          MWh
        </button>
      </div>

      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-table__corner" />
              {consumers.map((c) => (
                <th key={c.uid} className="matrix-table__col-header">
                  <div className="matrix-table__header-name">{c.name}</div>
                  <div className="matrix-table__header-mwh">{formatNumber(c.annualMWh)} MWh</div>
                </th>
              ))}
              <th className="matrix-table__col-header matrix-table__col-header--total">Total</th>
            </tr>
          </thead>
          <tbody>
            {generators.map((g) => {
              const row = activeMatrix[g.uid] ?? {}

              if (isConsumptionShare) {
                // Row total = sum of pct × consumer annual MWh across consumers (assigned MWh)
                const rowTotalMWh = consumers.reduce((sum, c) => {
                  const pct = row[c.uid] ?? 0
                  return sum + (pct / 100) * c.annualMWh
                }, 0)

                return (
                  <tr key={g.uid} data-testid="matrix-row">
                    <td className="matrix-table__row-header">
                      <div className="matrix-table__header-name">{g.name}</div>
                      <div className="matrix-table__header-mwh">{formatNumber(g.annualMWh)} MWh</div>
                    </td>
                    {consumers.map((c) => {
                      const pct = row[c.uid] ?? 0
                      const mwh = (pct / 100) * c.annualMWh

                      return (
                        <td key={c.uid} className="matrix-table__cell">
                          {inputMode === 'percent' ? (
                            <div className="matrix-table__cell-content">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="matrix-table__input"
                                value={pct}
                                onChange={(e) => handlePercentChange(g.uid, c.uid, e.target.value)}
                                data-testid="matrix-cell"
                                aria-label={`${g.name} to ${c.name} (%)`}
                              />
                              <span className="matrix-table__cell-computed">
                                {formatNumber(Math.round(mwh))} MWh
                              </span>
                            </div>
                          ) : (
                            <div className="matrix-table__cell-content">
                              <input
                                type="text"
                                inputMode="numeric"
                                className="matrix-table__input"
                                value={String(Math.round(mwh))}
                                onChange={(e) => handleMWhChange(g.uid, c.uid, e.target.value, c.annualMWh)}
                                data-testid="matrix-cell"
                                aria-label={`${g.name} to ${c.name} (MWh)`}
                              />
                              <span className="matrix-table__cell-computed">{pct.toFixed(1)} %</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="matrix-table__total" data-testid="row-total">
                      <div>{formatNumber(Math.round(rowTotalMWh))} MWh</div>
                    </td>
                  </tr>
                )
              }

              // generator-share mode (existing behaviour)
              const rowTotalPct = consumers.reduce((sum, c) => sum + (row[c.uid] ?? 0), 0)
              const rowTotalMWh = (rowTotalPct / 100) * g.annualMWh
              const overAllocated = rowTotalPct > 100

              return (
                <tr key={g.uid} data-testid="matrix-row">
                  <td className="matrix-table__row-header">
                    <div className="matrix-table__header-name">{g.name}</div>
                    <div className="matrix-table__header-mwh">{formatNumber(g.annualMWh)} MWh</div>
                  </td>
                  {consumers.map((c) => {
                    const pct = row[c.uid] ?? 0
                    const mwh = (pct / 100) * g.annualMWh

                    return (
                      <td key={c.uid} className="matrix-table__cell">
                        {inputMode === 'percent' ? (
                          <div className="matrix-table__cell-content">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              className="matrix-table__input"
                              value={pct}
                              onChange={(e) => handlePercentChange(g.uid, c.uid, e.target.value)}
                              data-testid="matrix-cell"
                              aria-label={`${g.name} to ${c.name} (%)`}
                            />
                            <span className="matrix-table__cell-computed">
                              {formatNumber(Math.round(mwh))} MWh
                            </span>
                          </div>
                        ) : (
                          <div className="matrix-table__cell-content">
                            <input
                              type="text"
                              inputMode="numeric"
                              className="matrix-table__input"
                              value={String(Math.round(mwh))}
                              onChange={(e) => handleMWhChange(g.uid, c.uid, e.target.value, g.annualMWh)}
                              data-testid="matrix-cell"
                              aria-label={`${g.name} to ${c.name} (MWh)`}
                            />
                            <span className="matrix-table__cell-computed">{pct.toFixed(1)} %</span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td
                    className={`matrix-table__total ${overAllocated ? 'matrix-table__total--warning' : ''}`}
                    data-testid="row-total"
                  >
                    <div>{formatNumber(Math.round(rowTotalMWh))} MWh</div>
                    <div>
                      {rowTotalPct.toFixed(1)} %
                      {overAllocated && (
                        <span className="matrix-table__warning-icon" title="Exceeds 100 %">
                          {' '}
                          ⚠
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {/* Column totals row */}
            <tr className="matrix-table__totals-row">
              <td className="matrix-table__row-header matrix-table__row-header--total">Total</td>
              {consumers.map((c) => {
                if (isConsumptionShare) {
                  // Sum of all generators' percentages for this consumer
                  const colTotalPct = generators.reduce((sum, g) => {
                    const pct = (activeMatrix[g.uid] ?? {})[c.uid] ?? 0
                    return sum + pct
                  }, 0)
                  const colTotalMWh = (colTotalPct / 100) * c.annualMWh
                  const overAllocated = colTotalPct > 100
                  return (
                    <td
                      key={c.uid}
                      className={`matrix-table__total ${overAllocated ? 'matrix-table__total--warning' : ''}`}
                      data-testid="consumer-allocated-pct"
                      title={
                        overAllocated
                          ? 'Over-allocation is allowed and results in excess energy above the consumer\u2019s demand.'
                          : undefined
                      }
                    >
                      <div>{formatNumber(Math.round(colTotalMWh))} MWh</div>
                      <div>
                        {colTotalPct.toFixed(1)} %
                        {overAllocated && (
                          <span
                            className="matrix-table__warning-icon"
                            title="Over-allocation is allowed and results in excess energy."
                          >
                            {' '}
                            ⚠
                          </span>
                        )}
                      </div>
                    </td>
                  )
                }
                // generator-share column totals
                const colTotalMWh = generators.reduce((sum, g) => {
                  const pct = (matrix[g.uid] ?? {})[c.uid] ?? 0
                  return sum + (pct / 100) * g.annualMWh
                }, 0)
                const colTotalPct = c.annualMWh > 0 ? (colTotalMWh / c.annualMWh) * 100 : 0
                return (
                  <td key={c.uid} className="matrix-table__total" data-testid="col-total">
                    <div>{formatNumber(Math.round(colTotalMWh))} MWh</div>
                    <div>{colTotalPct.toFixed(1)} %</div>
                  </td>
                )
              })}
              <td className="matrix-table__total" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
