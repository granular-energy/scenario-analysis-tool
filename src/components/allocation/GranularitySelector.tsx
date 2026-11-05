/** Matching granularity selector with full explanations of each method and shape-preservation note. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import type { MatchingGranularity } from '../../engine/types'
import { SHAPE_PRESERVED_TOOLTIP } from '../results/granularityLabel'

/** Render "shape preserved" as an inline element with a tooltip. */
function ShapePreservedTip() {
  return (
    <abbr
      className="granularity-selector__shape-tip"
      title={SHAPE_PRESERVED_TOOLTIP}
      aria-label="Shape preserved: a generator's allocation follows its own hourly output shape and is not redistributed into other hours."
    >
      shape preserved
    </abbr>
  )
}

const OPTIONS: {
  value: MatchingGranularity
  label: string
  descriptionParts: (string | 'SHAPE_TIP')[]
}[] = [
  {
    value: 'hourly',
    label: 'Hourly matching only',
    descriptionParts: [
      'Aims for 100 % matching in every hour. Allocation in each hour is capped at that hour\u2019s consumption, so there is never over-allocation. The hourly and annual scores are the same number. This is 24/7 hourly matching, the strictest standard.',
    ],
  },
  {
    value: 'monthly',
    label: 'Monthly matching target',
    descriptionParts: [
      'Aims for 100 % matching in every calendar month, as close as supply allows. Allocation in each month is capped at that month\u2019s consumption and keeps the generator\u2019s own hourly shape (',
      'SHAPE_TIP',
      '), so within the month some hours are over-supplied (excess) and others fall short. The hourly score shows how much of a 100 %-monthly-matched position holds hour by hour.',
    ],
  },
  {
    value: 'annual',
    label: 'Annual matching target',
    descriptionParts: [
      'Aims for 100 % matching over the whole year, as with annual certificates (GoOs, REGOs). Allocation is capped at annual consumption and keeps the generator\u2019s shape (',
      'SHAPE_TIP',
      '). The annual score can reach 100 % while the hourly score shows how much of that claim holds hour by hour.',
    ],
  },
  {
    value: 'as-produced',
    label: 'As produced (no cap)',
    descriptionParts: [
      'The consumer receives its full share of each generator\u2019s output in every hour, with nothing held back. This is what a pay-as-produced PPA delivers. Excess appears wherever generation exceeds consumption in the hour.',
    ],
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
              <span className="granularity-selector__desc">
                {opt.descriptionParts.map((part, i) =>
                  part === 'SHAPE_TIP' ? <ShapePreservedTip key={i} /> : <span key={i}>{part}</span>,
                )}
              </span>
            </div>
          </label>
        ))}
      </div>
      <div className="granularity-selector__note" data-testid="how-allocation-works">
        <strong>How allocation works</strong>
        <p>
          In all four methods a generator's allocation follows its own hourly output shape — it is never moved
          into the hours that happen to need it. The methods differ only in the window within which allocation
          is capped at consumption: every hour, every month, the whole year, or not at all.
        </p>
      </div>
    </fieldset>
  )
}
