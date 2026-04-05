const COMPARISON_COLORS = ['#00988B', '#E8A838', '#5B8DEF']

interface ScenarioColumnProps {
  name: string
  consumptionProfileName: string
  hourlyScore: number
  annualScore: number
  colorIndex: number
}

function ScenarioColumn({
  name,
  consumptionProfileName,
  hourlyScore,
  annualScore,
  colorIndex,
}: ScenarioColumnProps) {
  const color = COMPARISON_COLORS[colorIndex] ?? COMPARISON_COLORS[0]

  return (
    <div className="compare-scenario-col">
      <div className="compare-scenario-color-bar" style={{ backgroundColor: color }} />
      <span className="compare-scenario-name">{name}</span>
      <span className="compare-scenario-profile">{consumptionProfileName}</span>
      <div className="compare-score-card">
        <span className="compare-score-value" style={{ color }}>
          {Math.round(hourlyScore)}%
        </span>
        <span className="compare-score-label">Hourly Matching</span>
      </div>
      <div className="compare-score-card">
        <span className="compare-score-value-secondary">
          {Math.round(annualScore)}%
        </span>
        <span className="compare-score-label">Annual Matching</span>
      </div>
    </div>
  )
}

export { COMPARISON_COLORS }
export default ScenarioColumn
