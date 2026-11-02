/** Matching granularity selector with one-line explanations. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import type { MatchingGranularity } from '../../engine/types'

const OPTIONS: { value: MatchingGranularity; label: string; description: string }[] = [
  {
    value: 'hourly',
    label: 'Hourly',
    description: 'Supply and demand are compared hour by hour.',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Supply is matched to demand within each calendar month.',
  },
  {
    value: 'annual',
    label: 'Annual',
    description: 'Total annual supply is compared to total annual demand.',
  },
]

export function GranularitySelector() {
  const { state, dispatch } = usePortfolioContext()

  return (
    <fieldset className="granularity-selector" data-testid="granularity-selector">
      <legend className="granularity-selector__legend">Matching granularity</legend>
      <div className="granularity-selector__options">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`granularity-selector__option ${
              state.granularity === opt.value ? 'granularity-selector__option--active' : ''
            }`}
          >
            <input
              type="radio"
              name="granularity"
              value={opt.value}
              checked={state.granularity === opt.value}
              onChange={() => dispatch({ type: 'SET_GRANULARITY', granularity: opt.value })}
              className="granularity-selector__radio"
            />
            <span className="granularity-selector__label">{opt.label}</span>
            <span className="granularity-selector__desc">{opt.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
