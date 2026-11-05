/** Persistent score strip showing hourly and annual matching scores. */

import { usePortfolioContext } from '../../state/usePortfolioContext'
import { granularityLabel } from '../results/granularityLabel'

export function ScoreStrip() {
  const { state, engineResult } = usePortfolioContext()

  if (!engineResult) return null

  const hourly = engineResult.portfolio.hourlyScore
  const annual = engineResult.portfolio.annualScore
  const label = granularityLabel(state.granularity)

  return (
    <div className="score-strip" data-testid="score-strip">
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
  )
}
