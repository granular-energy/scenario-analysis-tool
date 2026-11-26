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

interface MethodFact {
  readonly label: string
  readonly parts: readonly (string | 'SHAPE_TIP')[]
}

const OPTIONS: {
  value: MatchingGranularity
  label: string
  facts: readonly MethodFact[]
}[] = [
  {
    value: 'as-produced',
    label: 'As produced (no cap)',
    facts: [
      { label: 'Cap', parts: ['None. The consumer takes everything the matrix offers, hour by hour.'] },
      {
        label: 'Profile',
        parts: ['Preserved (', 'SHAPE_TIP', '): the offer is taken exactly as generated.'],
      },
      {
        label: 'Outcome',
        parts: ['Hours where the offer exceeds consumption show as excess; nothing is held back as surplus.'],
      },
      { label: 'Like', parts: ['A pay-as-produced PPA.'] },
    ],
  },
  {
    value: 'annual',
    label: 'Annual matching target',
    facts: [
      { label: 'Cap', parts: ['The year. Allocation is limited to 100 % of annual consumption.'] },
      {
        label: 'Profile',
        parts: ['Preserved (', 'SHAPE_TIP', '): the whole year’s offer is scaled by a single factor.'],
      },
      {
        label: 'Outcome',
        parts: [
          'Some hours are over-supplied (excess) and others short (unmatched). Anything offered beyond annual consumption is surplus.',
        ],
      },
      { label: 'Like', parts: ['Annual certificates (GoOs, REGOs).'] },
    ],
  },
  {
    value: 'monthly',
    label: 'Monthly matching target',
    facts: [
      { label: 'Cap', parts: ['Each month. Allocation is limited to that month’s consumption.'] },
      {
        label: 'Profile',
        parts: ['Preserved (', 'SHAPE_TIP', '): each month’s offer is scaled by its own factor.'],
      },
      {
        label: 'Outcome',
        parts: [
          'Excess and unmatched hours within each month. Anything offered beyond a month’s consumption is surplus and cannot be carried into another month.',
        ],
      },
      { label: 'Like', parts: ['Monthly matching targets.'] },
    ],
  },
  {
    value: 'hourly',
    label: 'Hourly matching only',
    facts: [
      { label: 'Cap', parts: ['Each hour. Allocation is limited to that hour’s consumption.'] },
      {
        label: 'Profile',
        parts: [
          'Not preserved. This is the only method that does not respect shape preservation: output above demand in an hour is clipped rather than preserved.',
        ],
      },
      { label: 'Outcome', parts: ['Never any excess. Everything clipped is surplus.'] },
      { label: 'Like', parts: ['24/7 hourly matching.'] },
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
              <dl className="granularity-selector__desc granularity-selector__facts">
                {opt.facts.map((fact) => (
                  <div key={fact.label} className="granularity-selector__fact">
                    <dt>{fact.label}</dt>
                    <dd>
                      {fact.parts.map((part, i) =>
                        part === 'SHAPE_TIP' ? <ShapePreservedTip key={i} /> : <span key={i}>{part}</span>,
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
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
