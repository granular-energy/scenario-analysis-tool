/** Allocation method selector with full explanations of each method and shape-preservation note. */

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
    value: 'as-produced',
    label: 'As produced (no cap)',
    descriptionParts: [
      'The consumer receives its full share of each generator\u2019s output in every hour, with nothing held back. Generator shape fully preserved (',
      'SHAPE_TIP',
      '). Excess appears wherever generation exceeds consumption in the hour; nothing is left as surplus. This is what a pay-as-produced PPA delivers.',
    ],
  },
  {
    value: 'annual',
    label: 'Annual matching target',
    descriptionParts: [
      'Allocates up to 100 % of each consumer\u2019s annual consumption, as with annual certificates (GoOs, REGOs). The generator\u2019s hourly shape is kept (',
      'SHAPE_TIP',
      '), so some hours are over-supplied (excess) and others short (unmatched). Generation beyond annual consumption is left as surplus.',
    ],
  },
  {
    value: 'monthly',
    label: 'Monthly matching target',
    descriptionParts: [
      'As annual, but the cap applies month by month: allocation in each month is limited to that month\u2019s consumption, keeping the generator\u2019s shape within the month (',
      'SHAPE_TIP',
      '). Generation beyond a month\u2019s consumption is surplus and cannot be carried into another month.',
    ],
  },
  {
    value: 'hourly',
    label: 'Hourly matching only',
    descriptionParts: [
      'Allocation in each hour is limited to that hour\u2019s consumption, so there is never any excess. The generator\u2019s shape is clipped rather than preserved: output above demand in an hour is left as surplus. This is 24/7 hourly matching, the strictest standard.',
    ],
  },
]

export function GranularitySelector() {
  const { state, dispatch } = usePortfolioContext()

  return (
    <fieldset className="granularity-selector" data-testid="granularity-selector">
      <legend className="granularity-selector__legend">Allocation method</legend>
      <p className="granularity-selector__intro">
        Choose how generation is allocated to each consumer. These are four simple allocation methods, listed
        from least to most strict. Many other methods exist and are available in the Granular Energy platform.
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
          A generator's output is never moved into the hours that happen to need it. The methods differ in the
          window within which allocation is capped at consumption: not at all, the whole year, every month, or
          every hour. With no cap, an annual cap or a monthly cap the generator's hourly shape is preserved,
          so over-supplied hours show as excess. Hourly matching is the one method that clips the shape:
          nothing above an hour's demand is allocated, so there is no excess, only surplus.
        </p>
      </div>
    </fieldset>
  )
}
