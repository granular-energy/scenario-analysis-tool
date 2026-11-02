/** Allocation tab: matrix grid, allocate evenly button, and granularity selector. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import { AllocationMatrix } from './AllocationMatrix'
import { GranularitySelector } from './GranularitySelector'

export function AllocationTab() {
  const { dispatch } = usePortfolioContext()

  return (
    <div className="allocation-tab">
      <section className="content-card">
        <div className="allocation-tab__header">
          <h2>Allocation matrix</h2>
          <button
            className="btn-secondary"
            onClick={() => dispatch({ type: 'ALLOCATE_EVENLY' })}
            data-testid="allocate-evenly"
          >
            Allocate evenly
          </button>
        </div>
        <p className="allocation-tab__hint">
          Set the percentage of each generator's output allocated to each consumer. Row totals should not
          exceed 100 %.
        </p>
        <AllocationMatrix />
      </section>

      <section className="content-card">
        <GranularitySelector />
      </section>
    </div>
  )
}
