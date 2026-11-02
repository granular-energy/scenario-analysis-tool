/** Persistent score strip showing hourly and annual matching scores. */

import { usePortfolioContext } from '../../state/usePortfolioContext'

export function ScoreStrip() {
  const { engineResult } = usePortfolioContext()

  if (!engineResult) return null

  const hourly = engineResult.portfolio.hourlyScore
  const annual = engineResult.portfolio.annualScore

  return (
    <div className="score-strip" data-testid="score-strip">
      <div className="score-strip__item">
        <span className="score-strip__label">Hourly matching score</span>
        <span className="score-strip__value" data-testid="hourly-score">
          {hourly.toFixed(2)} %
        </span>
      </div>
      <div className="score-strip__item">
        <span className="score-strip__label">Annual matching score</span>
        <span className="score-strip__value" data-testid="annual-score">
          {annual.toFixed(2)} %
        </span>
      </div>
    </div>
  )
}
