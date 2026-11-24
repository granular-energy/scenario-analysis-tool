/** Allocation tab: mode toggle, matrix grid, allocate evenly button, and granularity selector. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import { AllocationMatrix } from './AllocationMatrix'
import { GranularitySelector } from './GranularitySelector'
import type { AllocationMode } from '../../engine/types'

const MODE_DESCRIPTIONS: Record<AllocationMode, string> = {
  'generator-share':
    'Split each generator\u2019s annual output across consumers. Each cell sets the percentage of that generator\u2019s total production allocated to the consumer.',
  'consumption-share':
    'Set what percentage of each consumer\u2019s annual demand is supplied in the generator\u2019s hourly shape. The generator\u2019s own library size is ignored.',
}

export function AllocationTab() {
  const { state, dispatch } = usePortfolioContext()
  const mode = state.allocationMode

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

        {/* Segmented toggle for allocation mode */}
        <div className="allocation-mode-toggle" data-testid="allocation-mode-toggle">
          <button
            className={`allocation-mode-toggle__option ${mode === 'generator-share' ? 'allocation-mode-toggle__option--active' : ''}`}
            aria-pressed={mode === 'generator-share'}
            onClick={() => dispatch({ type: 'SET_ALLOCATION_MODE', mode: 'generator-share' })}
            data-testid="mode-generator-share"
          >
            Share of generator output
          </button>
          <button
            className={`allocation-mode-toggle__option ${mode === 'consumption-share' ? 'allocation-mode-toggle__option--active' : ''}`}
            aria-pressed={mode === 'consumption-share'}
            onClick={() => dispatch({ type: 'SET_ALLOCATION_MODE', mode: 'consumption-share' })}
            data-testid="mode-consumption-share"
          >
            Set % of consumption
          </button>
        </div>

        <p className="allocation-tab__hint" data-testid="allocation-mode-description">
          {MODE_DESCRIPTIONS[mode]}
        </p>

        <AllocationMatrix />
      </section>

      <section className="content-card">
        <GranularitySelector />
      </section>
    </div>
  )
}
