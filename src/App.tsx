import { useState, useMemo, useCallback } from 'react'
import type { GenerationMix } from './types'
import { consumptionProfiles } from './data/profiles/consumption'
import { generationProfiles } from './data/profiles/generation'
import { calculateHourlyMatching } from './utils/matching'
import ProfileSelector from './components/ProfileSelector/ProfileSelector'
import MixSliders from './components/MixSliders/MixSliders'
import './App.css'

const DEFAULT_PROFILE_ID = 'uk-data-centre'

function buildInitialMix(): GenerationMix {
  const mix: GenerationMix = {}
  for (const profile of generationProfiles) {
    mix[profile.technology] = 0
  }
  return mix
}

function App() {
  const [selectedProfileId, setSelectedProfileId] = useState(DEFAULT_PROFILE_ID)
  const [mix, setMix] = useState<GenerationMix>(buildInitialMix)

  const selectedProfile = useMemo(
    () => consumptionProfiles.find((p) => p.id === selectedProfileId) ?? consumptionProfiles[0],
    [selectedProfileId]
  )

  const result = useMemo(
    () => calculateHourlyMatching(selectedProfile, mix, generationProfiles),
    [selectedProfile, mix]
  )

  const handleMixChange = useCallback((technology: string, percentage: number) => {
    setMix((prev) => ({ ...prev, [technology]: percentage }))
  }, [])

  return (
    <div className="app">
      <h1>Scenario Analysis Tool</h1>
      <div className="controls">
        <ProfileSelector
          profiles={consumptionProfiles}
          selectedProfileId={selectedProfileId}
          onSelect={setSelectedProfileId}
        />
        <MixSliders
          generationProfiles={generationProfiles}
          mix={mix}
          onMixChange={handleMixChange}
        />
      </div>
      <div className="results">
        <div className="cfe-score">
          <span className="cfe-score-value">{Math.round(result.cfeScore)}%</span>
          <span className="cfe-score-label">CFE Score</span>
        </div>
      </div>
    </div>
  )
}

export default App
