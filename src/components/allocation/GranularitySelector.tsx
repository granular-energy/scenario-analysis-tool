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
      'No cap. The consumer takes everything the matrix offers, hour by hour, in the generator’s own hourly profile (',
      'SHAPE_TIP',
      '). Hours where the offer exceeds consumption show as excess; nothing is held back as surplus. This is what a pay-as-produced PPA delivers.',
    ],
  },
  {
    value: 'annual',
    label: 'Annual matching target',
    descriptionParts: [
      'Capped over the year. The consumer takes the offer up to 100 % of its annual consumption, as with annual certificates (GoOs, REGOs). The whole year’s offer is scaled by a single factor, so the generator’s hourly profile is unchanged (',
      'SHAPE_TIP',
      '): some hours are still over-supplied (excess) and others short (unmatched). Anything offered beyond annual consumption is surplus.',
    ],
  },
  {
    value: 'monthly',
    label: 'Monthly matching target',
    descriptionParts: [
      'Capped month by month. Allocation in each month is limited to that month’s consumption. The offer is scaled within each month, so the profile is unchanged inside the month (',
      'SHAPE_TIP',
      '). Surplus from one month cannot be carried into another.',
    ],
  },
  {
    value: 'hourly',
    label: 'Hourly matching only',
    descriptionParts: [
      'Capped hour by hour. Allocation in each hour is limited to that hour’s consumption, so there is never any excess. This is the only method that does not preserve the generator’s profile: output above demand in an hour is clipped rather than preserved and left as surplus. This is 24/7 hourly matching, the strictest standard.',
    ],
  },
]

export function GranularitySelector() {
  const { state, dispatch } = usePortfolioContext()

  return (
    <fieldset className="granularity-selector" data-testid="granularity-selector">
      <legend className="granularity-selector__legend">Allocation method</legend>
      <p className="granularity-selector__intro">
        The allocation matrix above decides how much of each generator’s output is offered to each consumer.
        The allocation method decides how much of that offer the consumer actually takes, by capping it
        against the consumer’s consumption over a time window. These four simple methods are listed from least
        to most strict; many other methods exist and are available in the Granular Energy platform.
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
        <strong>How the matrix and the method work together</strong>
        <p>
          <b>Two steps.</b> The matrix sets the offer. With “Share of generator output” a cell is the share of
          a generator’s annual output offered to a consumer; with “Set % of consumption” a cell is the
          percentage of the consumer’s annual demand offered in that generator’s hourly profile. Either way
          the offer follows the generator’s profile hour by hour. The method then decides how much of the
          offer is taken.
        </p>
        <p>
          <b>The matrix is a ceiling; the method only cuts.</b> A consumer never receives more than the matrix
          offers. If the offer is below the method’s cap, the method changes nothing, except hourly matching,
          which still trims individual hours. If the offer is above the cap, the method cuts it back and the
          remainder is surplus.
        </p>
        <p>
          <b>Profile preserved or not.</b> As produced, annual and monthly scale a whole window’s offer by one
          factor, so the generator’s hourly profile is unchanged: it still over-supplies some hours (excess)
          and under-supplies others (unmatched). Hourly matching trims each hour separately, changing the
          profile, and is the only method with no excess.
        </p>
        <p>
          <b>Example.</b> Offer a consumer 60 % of its annual demand as solar and 60 % as wind, 120 % in
          total. As produced allocates all 120 %, with large excess. Annual target cuts it to 100 %, leaving
          20 % surplus, profile preserved. Monthly target cuts each month to that month’s consumption. Hourly
          matching keeps only the generation that falls inside each hour’s demand, typically well under 100 %.
        </p>
      </div>
    </fieldset>
  )
}
