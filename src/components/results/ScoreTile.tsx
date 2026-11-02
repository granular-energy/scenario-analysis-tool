/** A single KPI tile with value, label, unit, and info tooltip. */

import { useState } from 'react'

interface ScoreTileProps {
  label: string
  value: string
  unit: string
  tooltip: string
  /** Whether to render the value in teal accent. */
  accent?: boolean
  /** data-testid for the tile container. */
  testId?: string
}

export function ScoreTile({ label, value, unit, tooltip, accent, testId }: ScoreTileProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="score-tile" data-testid={testId}>
      <div className="score-tile__header">
        <span className="score-tile__label">{label}</span>
        <button
          className="score-tile__info"
          aria-label={`Info: ${label}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip((v) => !v)}
          type="button"
        >
          &#9432;
        </button>
        {showTooltip && (
          <div className="score-tile__tooltip" role="tooltip">
            {tooltip}
          </div>
        )}
      </div>
      <div className={`score-tile__value ${accent ? 'score-tile__value--accent' : ''}`}>
        {value}
        <span className="score-tile__unit">{unit}</span>
      </div>
    </div>
  )
}
