/** Persistent strip showing whole-portfolio totals and matching scores. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import { granularityLabel } from '../results/granularityLabel'

function formatMWh(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

export function ScoreStrip() {
  const { state, engineResult } = usePortfolioContext()

  if (!engineResult) return null

  const hourly = engineResult.portfolio.hourlyScore
  const annual = engineResult.portfolio.annualScore
  const totalConsumption = state.consumers.reduce((sum, c) => sum + c.annualMWh, 0)
  const totalGeneration = state.generators.reduce((sum, g) => sum + g.annualMWh, 0)
  const label = granularityLabel(state.granularity)

  return (
    <div className="score-strip" data-testid="score-strip">
      <div className="score-strip__caption" data-testid="score-strip-caption">
        Whole portfolio · {label}
      </div>
      <div className="score-strip__items">
        <div className="score-strip__item">
          <span className="score-strip__label">Annual consumption</span>
          <span className="score-strip__value" data-testid="total-consumption">
            {formatMWh(totalConsumption)} <span className="score-strip__unit">MWh</span>
          </span>
        </div>
        <div className="score-strip__item">
          <span className="score-strip__label">Annual generation</span>
          <span className="score-strip__value" data-testid="total-generation">
            {formatMWh(totalGeneration)} <span className="score-strip__unit">MWh</span>
          </span>
        </div>
        <div className="score-strip__divider" aria-hidden="true" />
        <div className="score-strip__item" title={`Granularity: ${label}`}>
          <span className="score-strip__label">Hourly matching score</span>
          <span className="score-strip__value" data-testid="hourly-score">
            {hourly.toFixed(2)} %
          </span>
        </div>
        <div className="score-strip__item" title={`Granularity: ${label}`}>
          <span className="score-strip__label">Annual matching score</span>
          <span className="score-strip__value" data-testid="annual-score">
            {annual.toFixed(2)} %
          </span>
        </div>
      </div>
    </div>
  )
}
