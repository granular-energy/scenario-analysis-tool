/** Allocation matrix grid: generators as rows, consumers as columns. */

import { useCallback } from 'react'
import { usePortfolioContext } from '../../state/usePortfolioContext'

export function AllocationMatrix() {
  const { state, dispatch } = usePortfolioContext()
  const { consumers, generators, matrix } = state

  const handleChange = useCallback(
    (generatorUid: string, consumerUid: string, value: string) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return
      dispatch({ type: 'SET_ALLOCATION', generatorUid, consumerUid, percent: parsed })
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
    <div className="matrix-scroll" data-testid="allocation-matrix">
      <table className="matrix-table">
        <thead>
          <tr>
            <th className="matrix-table__corner" />
            {consumers.map((c) => (
              <th key={c.uid} className="matrix-table__col-header">
                {c.name}
              </th>
            ))}
            <th className="matrix-table__col-header matrix-table__col-header--total">Total</th>
          </tr>
        </thead>
        <tbody>
          {generators.map((g) => {
            const row = matrix[g.uid] ?? {}
            const rowTotal = consumers.reduce((sum, c) => sum + (row[c.uid] ?? 0), 0)
            const overAllocated = rowTotal > 100

            return (
              <tr key={g.uid} data-testid="matrix-row">
                <td className="matrix-table__row-header">{g.name}</td>
                {consumers.map((c) => (
                  <td key={c.uid} className="matrix-table__cell">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      className="matrix-table__input"
                      value={row[c.uid] ?? 0}
                      onChange={(e) => handleChange(g.uid, c.uid, e.target.value)}
                      data-testid="matrix-cell"
                      aria-label={`${g.name} to ${c.name} (%)`}
                    />
                  </td>
                ))}
                <td
                  className={`matrix-table__total ${overAllocated ? 'matrix-table__total--warning' : ''}`}
                  data-testid="row-total"
                >
                  {rowTotal} %
                  {overAllocated && (
                    <span className="matrix-table__warning-icon" title="Exceeds 100 %">
                      {' '}
                      ⚠
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
