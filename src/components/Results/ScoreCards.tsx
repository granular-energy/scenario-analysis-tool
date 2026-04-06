interface ScoreCardsProps {
  cfeScore: number
  annualScore: number
}

function ScoreCards({ cfeScore, annualScore }: ScoreCardsProps) {
  return (
    <div className="score-cards-row">
      <div className="score-card-block">
        <span className="score-card-value">{Math.round(cfeScore)}%</span>
        <span className="score-card-label">Hourly Matching</span>
      </div>
      <div className="score-card-block">
        <span className="score-card-value score-card-value--secondary">
          {Math.round(annualScore)}%
        </span>
        <span className="score-card-label">Annual Matching</span>
      </div>
    </div>
  )
}

export default ScoreCards
