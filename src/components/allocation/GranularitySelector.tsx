/** Matching granularity selector with full explanations of each method. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import type { MatchingGranularity } from '../../engine/types'

const OPTIONS: { value: MatchingGranularity; label: string; description: string }[] = [
  {
    value: 'hourly',
    label: 'Hourly matching only',
    description:
      'Generation is matched to demand hour by hour. Only energy generated in the same hour as consumption counts as matched. This is the strictest measure of temporal matching and shows the true alignment between generation and demand profiles.',
  },
  {
    value: 'monthly',
    label: 'Monthly matching target',
    description:
      'Generation is matched to demand within each calendar month. A generator can cover demand in any hour of the same month, even if it was not generating in that specific hour. This relaxes the hourly constraint and typically produces a higher matching score, but energy generated in excess of demand within any hour appears as excess.',
  },
  {
    value: 'annual',
    label: 'Annual matching target',
    description:
      'Total annual generation is compared to total annual demand. A generator can cover demand in any hour of the year. This is the loosest measure — it only checks that enough energy was produced over the year, regardless of when. Any mismatch in timing appears as excess in some hours and unmatched demand in others.',
  },
]

export function GranularitySelector() {
  const { state, dispatch } = usePortfolioContext()

  return (
    <fieldset className="granularity-selector" data-testid="granularity-selector">
      <legend className="granularity-selector__legend">Matching granularity</legend>
      <p className="granularity-selector__intro">
        In every method, generation is allocated to each consumer largest generator first, up to the
        consumer's consumption in the matching window, keeping each generator's hourly shape. This is how the
        Granular platform allocates.
      </p>
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
            <div className="granularity-selector__text">
              <span className="granularity-selector__label">{opt.label}</span>
              <span className="granularity-selector__desc">{opt.description}</span>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
