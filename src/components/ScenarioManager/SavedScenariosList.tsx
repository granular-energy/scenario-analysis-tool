import type { SavedScenario, GenerationMix } from '../../types'

interface SavedScenariosListProps {
  scenarios: SavedScenario[]
  onLoad: (scenario: SavedScenario) => void
  onDelete: (id: string) => void
}

function formatMix(mix: GenerationMix): string {
  const active = Object.entries(mix).filter(([, pct]) => pct > 0)
  if (active.length === 0) return 'No generation'
  return active.map(([tech, pct]) => `${tech} ${pct}%`).join(', ')
}

function SavedScenariosList({ scenarios, onLoad, onDelete }: SavedScenariosListProps) {
  if (scenarios.length === 0) return null

  return (
    <div className="saved-scenarios">
      <h3 className="saved-scenarios-title">Saved Scenarios</h3>
      <div className="saved-scenarios-list">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="saved-scenario-item">
            <div className="saved-scenario-info">
              <span className="saved-scenario-name">{scenario.name}</span>
              <span className="saved-scenario-detail">
                {scenario.consumptionProfileName} &middot; {formatMix(scenario.generationMix)}
              </span>
            </div>
            <div className="saved-scenario-actions">
              <button
                className="saved-scenario-load"
                onClick={() => onLoad(scenario)}
                type="button"
              >
                Load
              </button>
              <button
                className="saved-scenario-delete"
                onClick={() => onDelete(scenario.id)}
                type="button"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SavedScenariosList
