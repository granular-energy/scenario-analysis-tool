/** Card showing a single generator in the portfolio panel. */

import { useCallback, useState } from 'react'
import type { PortfolioGenerator } from '../../state/portfolioTypes'
import { Sparkline } from './Sparkline'

/** Technology-specific sparkline colours matching the design system. */
const TECH_COLOURS: Record<string, string> = {
  solar: 'var(--ge-tech-solar)',
  'wind-onshore': 'var(--ge-tech-wind-onshore)',
  'wind-offshore': 'var(--ge-tech-wind-offshore)',
  hydro: 'var(--ge-tech-hydro)',
  nuclear: 'var(--ge-tech-nuclear)',
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

interface GeneratorCardProps {
  generator: PortfolioGenerator
  onRemove: (uid: string) => void
  onUpdateSizing: (uid: string, annualMWh: number) => void
}

export function GeneratorCard({ generator, onRemove, onUpdateSizing }: GeneratorCardProps) {
  const [draft, setDraft] = useState(String(generator.annualMWh))

  // Compute implied capacity from annualMWh and capacityFactor
  const impliedMW = generator.capacityFactor > 0 ? generator.annualMWh / (generator.capacityFactor * 8760) : 0

  const handleBlur = useCallback(() => {
    const parsed = Number(draft.replace(/[, ]/g, ''))
    if (Number.isFinite(parsed) && parsed > 0) {
      onUpdateSizing(generator.uid, parsed)
    } else {
      setDraft(String(generator.annualMWh))
    }
  }, [draft, generator.uid, generator.annualMWh, onUpdateSizing])

  const colour = TECH_COLOURS[generator.technology] ?? 'var(--ge-teal)'

  return (
    <div className="member-card" data-testid="generator-card">
      <div className="member-card__header">
        <span className="member-card__name">{generator.name}</span>
        <button
          className="member-card__remove"
          onClick={() => onRemove(generator.uid)}
          aria-label={`Remove ${generator.name}`}
          data-testid="remove-member"
        >
          ✕
        </button>
      </div>
      <Sparkline shape={generator.shape} colour={colour} />
      <label className="member-card__sizing">
        <span className="member-card__sizing-label">Annual generation (MWh)</span>
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
          data-testid="generator-sizing"
        />
      </label>
      <div className="member-card__meta" data-testid="generator-capacity-hint">
        <span>
          ≈ {formatNumber(Math.round(impliedMW))} MW at a {generator.capacityFactor.toFixed(2)} capacity
          factor
        </span>
      </div>
    </div>
  )
}
