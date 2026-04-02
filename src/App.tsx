import { useState, useMemo, useCallback } from 'react'
import type { GenerationMix, Profile } from './types'
import { consumptionProfiles as builtInConsumption } from './data/profiles/consumption'
import { generationProfiles as builtInGeneration } from './data/profiles/generation'
import { calculateHourlyMatching, MONTH_HOURS } from './utils/matching'
import { loadCustomProfiles, saveCustomProfile, removeCustomProfile } from './utils/custom-profiles'
import Header from './components/Layout/Header'
import CallToAction from './components/Layout/CallToAction'
import ProfileSelector from './components/ProfileSelector/ProfileSelector'
import MixSliders from './components/MixSliders/MixSliders'
import HourlyHeatmap from './components/Charts/HourlyHeatmap'
import TechnologyContributionChart from './components/Charts/TechnologyContributionChart'
import AverageDayChart from './components/Charts/AverageDayChart'
import CsvUpload from './components/CsvUpload/CsvUpload'
import './App.css'

const DEFAULT_PROFILE_ID = 'data-centre'

function App() {
  const [customProfiles, setCustomProfiles] = useState<Profile[]>(loadCustomProfiles)
  const [selectedProfileId, setSelectedProfileId] = useState(DEFAULT_PROFILE_ID)
  const [mix, setMix] = useState<GenerationMix>({})
  const [uploadTarget, setUploadTarget] = useState<'consumption' | 'generation' | null>(null)

  // Merge built-in + custom profiles
  const allConsumption = useMemo(
    () => [...builtInConsumption, ...customProfiles.filter((p) => p.category === 'consumption')],
    [customProfiles]
  )
  const allGeneration = useMemo(
    () => [...builtInGeneration, ...customProfiles.filter((p) => p.category === 'generation')],
    [customProfiles]
  )

  const selectedProfile = useMemo(
    () => allConsumption.find((p) => p.id === selectedProfileId) ?? allConsumption[0],
    [selectedProfileId, allConsumption]
  )

  const result = useMemo(
    () => calculateHourlyMatching(selectedProfile, mix, allGeneration),
    [selectedProfile, mix, allGeneration]
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

  const handleProfileUploaded = useCallback((profile: Profile) => {
    saveCustomProfile(profile)
    setCustomProfiles(loadCustomProfiles())

    if (profile.category === 'consumption') {
      setSelectedProfileId(profile.id)
    }
    setUploadTarget(null)
  }, [])

  const handleRemoveCustomProfile = useCallback((id: string) => {
    removeCustomProfile(id)
    setCustomProfiles(loadCustomProfiles())
    // If the removed profile was selected, reset to default
    if (selectedProfileId === id) {
      setSelectedProfileId(DEFAULT_PROFILE_ID)
    }
  }, [selectedProfileId])

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="intro">
          <h2 className="intro-title">Estimate your hourly energy matching score</h2>
          <p className="intro-description">
            Select a consumption profile and adjust the generation mix to see how well
            your energy supply matches demand on an hour-by-hour basis. Unlike annual
            matching, hourly matching reveals how much of your consumption is truly
            covered by carbon-free energy in each hour of the year.
          </p>
        </div>
        <div className="controls-and-score">
          <section className="controls-section">
            <ProfileSelector
              profiles={allConsumption}
              selectedProfileId={selectedProfileId}
              onSelect={setSelectedProfileId}
              onUploadClick={() => setUploadTarget('consumption')}
              onRemoveCustom={handleRemoveCustomProfile}
              customProfileIds={customProfiles.filter((p) => p.category === 'consumption').map((p) => p.id)}
            />
            <MixSliders
              generationProfiles={allGeneration}
              mix={mix}
              onMixChange={handleMixChange}
              onUploadClick={() => setUploadTarget('generation')}
              customProfileIds={customProfiles.filter((p) => p.category === 'generation').map((p) => p.id)}
              onRemoveCustom={handleRemoveCustomProfile}
            />
          </section>
          <div className="cfe-score">
            <span className="cfe-score-value">{Math.round(result.cfeScore)}%</span>
            <span className="cfe-score-label">Hourly Matching Score</span>
            <p className="cfe-score-description">
              Weighted average percentage matching in each hour.
              Surplus in any hour cannot cover deficits elsewhere.
            </p>
          </div>
        </div>
        <section className="results-section">
          <div className="charts-row">
            <div className="chart-block chart-half">
              <p className="chart-description">
                Average consumption and generation shape over 24 hours.
                Grey area shows unmatched consumption.
              </p>
              <AverageDayChart
                consumptionProfile={selectedProfile}
                generationMix={mix}
                generationProfiles={allGeneration}
              />
            </div>
            <div className="chart-block chart-half">
              <p className="chart-description">
                Monthly technology contribution to matched energy.
                A diversified mix gives better year-round coverage.
              </p>
              <TechnologyContributionChart
                technologyContributions={result.technologyContributions}
                monthlyConsumption={monthlyConsumption}
              />
            </div>
          </div>
          <div className="chart-block">
            <p className="chart-description">
              Every hour of the year by matching percentage. Green = fully matched,
              red = significant gap between generation and consumption.
            </p>
            <HourlyHeatmap hourlyMatchingPercentage={result.hourlyMatchingPercentage} />
          </div>
        </section>
        <CallToAction />
      </main>

      {uploadTarget && (
        <CsvUpload
          category={uploadTarget}
          onProfileUploaded={handleProfileUploaded}
          onClose={() => setUploadTarget(null)}
        />
      )}
    </div>
  )
}

export default App
