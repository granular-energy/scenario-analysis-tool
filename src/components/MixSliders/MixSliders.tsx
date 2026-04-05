import { useCallback, useState } from 'react'
import type { GenerationMix, Profile } from '../../types'

interface MixSlidersProps {
  generationProfiles: Profile[]
  mix: GenerationMix
  onMixChange: (technology: string, percentage: number) => void
  onUploadClick?: () => void
  customProfileIds?: string[]
  onRemoveCustom?: (id: string) => void
}

const MAX_SELECTIONS = 5

function MixSliders({
  generationProfiles,
  mix,
  onMixChange,
  onUploadClick,
  customProfileIds = [],
  onRemoveCustom,
}: MixSlidersProps) {
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])

  const availableProfiles = generationProfiles.filter(
    (p) => !selectedTechs.includes(p.technology)
  )

  const handleAdd = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tech = e.target.value
      if (!tech) return
      setSelectedTechs((prev) => [...prev, tech])
      onMixChange(tech, 0)
      e.target.value = ''
    },
    [onMixChange]
  )

  const handleRemove = useCallback(
    (tech: string) => {
      setSelectedTechs((prev) => prev.filter((t) => t !== tech))
      onMixChange(tech, 0)
      // Also remove from custom profiles if it's custom
      const profile = generationProfiles.find((p) => p.technology === tech)
      if (profile && customProfileIds.includes(profile.id) && onRemoveCustom) {
        onRemoveCustom(profile.id)
      }
    },
    [onMixChange, generationProfiles, customProfileIds, onRemoveCustom]
  )

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
      <p className="control-card-description">
        Add up to {MAX_SELECTIONS} technologies. Each percentage represents share
        of annual consumption. Total can exceed 100%.
      </p>

      {selectedTechs.length > 0 && (
        <div className="slider-list">
          {selectedTechs.map((tech) => {
            const profile = generationProfiles.find((p) => p.technology === tech)
            if (!profile) return null
            const value = mix[tech] ?? 0
            const isCustom = customProfileIds.includes(profile.id)
            return (
              <div key={tech} className="slider-row">
                <label htmlFor={`slider-${tech}`}>
                  {profile.name}
                  {isCustom && <span className="custom-badge">custom</span>}
                </label>
                <input
                  id={`slider-${tech}`}
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={value}
                  onChange={(e) => onMixChange(tech, Number(e.target.value))}
                />
                <div className="slider-value-group">
                  <input
                    className="slider-input"
                    type="number"
                    min={0}
                    max={200}
                    step={1}
                    value={value}
                    onChange={(e) => handleInputChange(tech, e.target.value)}
                    aria-label={`${profile.name} percentage`}
                  />
                  <span className="slider-unit">%</span>
                </div>
                <button
                  className="slider-remove"
                  onClick={() => handleRemove(tech)}
                  aria-label={`Remove ${profile.name}`}
                  type="button"
                >
                  &times;
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="mix-actions">
        {selectedTechs.length < MAX_SELECTIONS && availableProfiles.length > 0 && (
          <select
            className="add-technology-select"
            onChange={handleAdd}
            value=""
          >
            <option value="">+ Add generation technology</option>
            {availableProfiles.map((p) => (
              <option key={p.technology} value={p.technology}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {onUploadClick && (
          <button className="upload-csv-btn" onClick={onUploadClick} type="button">
            Upload custom CSV
          </button>
        )}
      </div>

      {selectedTechs.length === 0 && (
        <p className="mix-empty">Select a generation technology to get started.</p>
      )}
    </div>
  )
}

export default MixSliders
