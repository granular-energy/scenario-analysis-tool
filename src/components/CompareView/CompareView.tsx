import { useMemo, useCallback } from 'react'
import type { SavedScenario, Profile } from '../../types'
import { calculateHourlyMatching } from '../../utils/matching'
import ScenarioColumn from './ScenarioColumn'
import ComparisonMonthlyChart from './ComparisonMonthlyChart'
import ComparisonExampleDayChart from './ComparisonExampleDayChart'

const MAX_COMPARE = 3

interface CompareViewProps {
  savedScenarios: SavedScenario[]
  allConsumption: Profile[]
  allGeneration: Profile[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onDelete: (id: string) => void
  onExportPdf: () => void
}

function CompareView({
  savedScenarios,
  allConsumption,
  allGeneration,
  selectedIds,
  onSelectionChange,
  onDelete,
  onExportPdf,
}: CompareViewProps) {
  const handleToggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((s) => s !== id))
      } else if (selectedIds.length < MAX_COMPARE) {
        onSelectionChange([...selectedIds, id])
      }
    },
    [selectedIds, onSelectionChange]
  )

  const comparisonResults = useMemo(() => {
    return selectedIds
      .map((id) => {
        const scenario = savedScenarios.find((s) => s.id === id)
        if (!scenario) return null
        const profile = allConsumption.find((p) => p.id === scenario.consumptionProfileId)
        if (!profile) return null
        const result = calculateHourlyMatching(profile, scenario.generationMix, allGeneration)
        return { scenario, profile, result }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [selectedIds, savedScenarios, allConsumption, allGeneration])

  return (
    <div className="compare-view">
      <div className="intro">
        <h2 className="intro-title">Compare Scenarios</h2>
        <p className="intro-description">
          Select up to {MAX_COMPARE} saved scenarios to compare side by side.
          Save scenarios from the Builder tab first.
        </p>
      </div>

      {savedScenarios.length === 0 ? (
        <div className="compare-empty">
          <p>No saved scenarios yet. Go to the Builder tab to create and save scenarios.</p>
        </div>
      ) : (
        <>
          <div className="compare-picker">
            {savedScenarios.map((scenario) => {
              const isSelected = selectedIds.includes(scenario.id)
              const isDisabled = !isSelected && selectedIds.length >= MAX_COMPARE
              const profileMissing = !allConsumption.find(
                (p) => p.id === scenario.consumptionProfileId
              )

              return (
                <label
                  key={scenario.id}
                  className={`compare-picker-item${isSelected ? ' compare-picker-item--selected' : ''}${isDisabled ? ' compare-picker-item--disabled' : ''}${profileMissing ? ' compare-picker-item--warning' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(scenario.id)}
                    disabled={isDisabled || profileMissing}
                  />
                  <div className="compare-picker-info">
                    <span className="compare-picker-name">{scenario.name}</span>
                    <span className="compare-picker-detail">
                      {profileMissing
                        ? 'Profile unavailable'
                        : scenario.consumptionProfileName}
                    </span>
                  </div>
                  <button
                    className="saved-scenario-delete"
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete(scenario.id)
                    }}
                    type="button"
                  >
                    &times;
                  </button>
                </label>
              )
            })}
          </div>

          {comparisonResults.length >= 2 && (
            <>
              <div className="compare-actions">
                <button className="export-btn" onClick={onExportPdf} type="button">
                  Export Comparison PDF
                </button>
              </div>
              <section className="compare-results-section">
                <div className="compare-scores-row">
                  {comparisonResults.map(({ scenario, result }, i) => (
                    <ScenarioColumn
                      key={scenario.id}
                      name={scenario.name}
                      consumptionProfileName={scenario.consumptionProfileName}
                      hourlyScore={result.cfeScore}
                      annualScore={result.annualScore}
                      colorIndex={i}
                    />
                  ))}
                </div>

                <div className="chart-block">
                  <ComparisonMonthlyChart
                    scenarios={comparisonResults.map(({ scenario, result }) => ({
                      name: scenario.name,
                      monthlyScores: result.monthlyScores,
                    }))}
                  />
                </div>

                <div className="chart-block">
                  <ComparisonExampleDayChart
                    scenarios={comparisonResults.map(({ scenario, profile }) => ({
                      name: scenario.name,
                      consumptionProfile: profile,
                      generationMix: scenario.generationMix,
                      generationProfiles: allGeneration,
                    }))}
                  />
                </div>
              </section>
            </>
          )}

          {comparisonResults.length === 1 && (
            <div className="compare-empty">
              <p>Select at least 2 scenarios to compare.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CompareView
