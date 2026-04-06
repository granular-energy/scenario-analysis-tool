import { useCallback } from 'react'
import type { PortfolioProfile, AllocationMatrix as MatrixType } from '../../types'

interface AllocationMatrixProps {
  generators: PortfolioProfile[]
  consumers: PortfolioProfile[]
  matrix: MatrixType
  onAllocationChange: (generatorId: string, consumerId: string, percentage: number) => void
}

function AllocationMatrix({
  generators,
  consumers,
  matrix,
  onAllocationChange,
}: AllocationMatrixProps) {
  const handleChange = useCallback(
    (genId: string, conId: string, raw: string) => {
      const parsed = Number(raw)
      if (raw === '' || isNaN(parsed)) return
      onAllocationChange(genId, conId, parsed)
    },
    [onAllocationChange]
  )

  if (generators.length === 0 || consumers.length === 0) {
    return (
      <div className="results-empty">
        <p>
          Add at least one consumption and one generation profile on the Portfolio tab
          to define allocations.
        </p>
      </div>
    )
  }

  // Compute column sums (per generator)
  const colSums: Record<string, number> = {}
  for (const gen of generators) {
    let sum = 0
    const genAllocs = matrix[gen.id]
    if (genAllocs) {
      for (const con of consumers) {
        sum += genAllocs[con.id] ?? 0
      }
    }
    colSums[gen.id] = sum
  }

  return (
    <div className="allocation-matrix-wrap">
      <table className="allocation-matrix">
        <thead>
          <tr>
            <th></th>
            {generators.map((gen) => (
              <th key={gen.id}>{gen.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {consumers.map((con) => (
            <tr key={con.id}>
              <td>{con.name}</td>
              {generators.map((gen) => {
                const value = matrix[gen.id]?.[con.id] ?? 0
                return (
                  <td key={gen.id}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={value}
                      onChange={(e) => handleChange(gen.id, con.id, e.target.value)}
                      aria-label={`${gen.name} to ${con.name} allocation %`}
                    />
                    <span className="slider-unit">%</span>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr>
            <td style={{ fontWeight: 600, fontSize: '0.75rem' }}>Total</td>
            {generators.map((gen) => {
              const sum = colSums[gen.id]
              const isOver = sum > 100
              return (
                <td key={gen.id}>
                  <span className={`allocation-sum ${isOver ? 'allocation-sum--over' : 'allocation-sum--ok'}`}>
                    {sum}%
                  </span>
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default AllocationMatrix
