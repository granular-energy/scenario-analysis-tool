/** Card showing a single consumer in the portfolio panel. */

import { useCallback, useState } from 'react'
import type { PortfolioConsumer } from '../../state/portfolioTypes'
import { Sparkline } from './Sparkline'

interface ConsumerCardProps {
  consumer: PortfolioConsumer
  onRemove: (uid: string) => void
  onUpdateSizing: (uid: string, annualMWh: number) => void
}

export function ConsumerCard({ consumer, onRemove, onUpdateSizing }: ConsumerCardProps) {
  const [draft, setDraft] = useState(String(consumer.annualMWh))

  const handleBlur = useCallback(() => {
    const parsed = Number(draft.replace(/[, ]/g, ''))
    if (Number.isFinite(parsed) && parsed > 0) {
      onUpdateSizing(consumer.uid, parsed)
    } else {
      setDraft(String(consumer.annualMWh))
    }
  }, [draft, consumer.uid, consumer.annualMWh, onUpdateSizing])

  return (
    <div className="member-card" data-testid="consumer-card">
      <div className="member-card__header">
        <span className="member-card__name">{consumer.name}</span>
        <button
          className="member-card__remove"
          onClick={() => onRemove(consumer.uid)}
          aria-label={`Remove ${consumer.name}`}
          data-testid="remove-member"
        >
          ✕
        </button>
      </div>
      <Sparkline shape={consumer.shape} />
      <label className="member-card__sizing">
        <span className="member-card__sizing-label">Annual demand (MWh)</span>
        <input
          type="text"
          inputMode="numeric"
          className="member-card__sizing-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          data-testid="consumer-sizing"
        />
      </label>
    </div>
  )
}
