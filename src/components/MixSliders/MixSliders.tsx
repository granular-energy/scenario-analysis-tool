import { useCallback } from 'react'
import type { GenerationMix, Profile } from '../../types'

interface MixSlidersProps {
  generationProfiles: Profile[]
  mix: GenerationMix
  onMixChange: (technology: string, percentage: number) => void
}

function MixSliders({ generationProfiles, mix, onMixChange }: MixSlidersProps) {
  const handleInputChange = useCallback(
    (technology: string, raw: string) => {
      const parsed = Number(raw)
      if (raw === '' || isNaN(parsed)) return
      const clamped = Math.max(0, Math.min(200, Math.round(parsed)))
      onMixChange(technology, clamped)
    },
    [onMixChange]
  )

  return (
    <div className="mix-sliders">
      <h3>Generation Mix</h3>
      <p className="mix-description">
        Each percentage represents how much of your annual consumption is covered
        by that technology on an annual basis. For example, 60% wind means the
        wind source generates energy equal to 60% of your total annual demand.
        The total can exceed 100% (over-procurement) or be below 100%.
      </p>
      {generationProfiles.map((profile) => {
        const value = mix[profile.technology] ?? 0
        return (
          <div key={profile.technology} className="slider-row">
            <label htmlFor={`slider-${profile.technology}`}>
              {profile.name}
            </label>
            <input
              id={`slider-${profile.technology}`}
              type="range"
              min={0}
              max={200}
              step={1}
              value={value}
              onChange={(e) => onMixChange(profile.technology, Number(e.target.value))}
            />
            <div className="slider-value-group">
              <input
                className="slider-input"
                type="number"
                min={0}
                max={200}
                step={1}
                value={value}
                onChange={(e) => handleInputChange(profile.technology, e.target.value)}
                aria-label={`${profile.name} percentage`}
              />
              <span className="slider-unit">%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MixSliders
