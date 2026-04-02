import { useState, useMemo, useCallback } from 'react'
import type { GenerationMix } from './types'
import { consumptionProfiles } from './data/profiles/consumption'
import { generationProfiles } from './data/profiles/generation'
import { calculateHourlyMatching, MONTH_HOURS } from './utils/matching'
import Header from './components/Layout/Header'
import CallToAction from './components/Layout/CallToAction'
import ProfileSelector from './components/ProfileSelector/ProfileSelector'
import MixSliders from './components/MixSliders/MixSliders'
import MonthlyBreakdownChart from './components/Charts/MonthlyBreakdownChart'
import HourlyHeatmap from './components/Charts/HourlyHeatmap'
import TechnologyContributionChart from './components/Charts/TechnologyContributionChart'
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

  const monthlyConsumption = useMemo(
    () => MONTH_HOURS.map(({ start, end }) => {
      let total = 0
      for (let h = start; h < end; h++) {
        total += selectedProfile.data[h]
      }
      return total
    }),
    [selectedProfile]
  )

  const handleMixChange = useCallback((technology: string, percentage: number) => {
    setMix((prev) => ({ ...prev, [technology]: percentage }))
  }, [])

  return (
    <div className="app">
      <Header />
      <main className="main">
        <section className="controls-section">
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
        </section>
        <section className="results-section">
          <div className="cfe-score">
            <span className="cfe-score-value">{Math.round(result.cfeScore)}%</span>
            <span className="cfe-score-label">CFE Score</span>
          </div>
          <div className="charts">
            <MonthlyBreakdownChart monthlyScores={result.monthlyScores} />
            <HourlyHeatmap hourlyMatchingPercentage={result.hourlyMatchingPercentage} />
            <TechnologyContributionChart
              technologyContributions={result.technologyContributions}
              monthlyConsumption={monthlyConsumption}
            />
          </div>
        </section>
        <CallToAction />
      </main>
    </div>
  )
}

export default App
