import type { GenerationMix, Profile } from '../../types'

interface MixSlidersProps {
  generationProfiles: Profile[]
  mix: GenerationMix
  onMixChange: (technology: string, percentage: number) => void
}

function MixSliders({ generationProfiles, mix, onMixChange }: MixSlidersProps) {
  return (
    <div className="mix-sliders">
      <h3>Generation Mix</h3>
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
            <span className="slider-value">{value}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default MixSliders
