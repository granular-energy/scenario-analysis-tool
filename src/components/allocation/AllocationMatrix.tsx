/** Allocation matrix grid: generators as rows, consumers as columns. */

import { useCallback, useState } from 'react'
import { usePortfolioContext } from '../../state/usePortfolioContext'

type InputMode = 'percent' | 'mwh'

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

export function AllocationMatrix() {
  const { state, dispatch } = usePortfolioContext()
  const { consumers, generators, matrix } = state
  const [inputMode, setInputMode] = useState<InputMode>('percent')

  const handlePercentChange = useCallback(
    (generatorUid: string, consumerUid: string, value: string) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return
      dispatch({ type: 'SET_ALLOCATION', generatorUid, consumerUid, percent: parsed })
    },
    [dispatch],
  )

  const handleMWhChange = useCallback(
    (generatorUid: string, consumerUid: string, mwhValue: string, generatorAnnualMWh: number) => {
      const parsed = Number(mwhValue.replace(/[, ]/g, ''))
      if (!Number.isFinite(parsed) || generatorAnnualMWh <= 0) return
      const percent = (parsed / generatorAnnualMWh) * 100
      dispatch({ type: 'SET_ALLOCATION', generatorUid, consumerUid, percent })
    },
    [dispatch],
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
              const row = matrix[g.uid] ?? {}
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
