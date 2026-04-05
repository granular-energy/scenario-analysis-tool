import type { SavedScenario } from '../types'

const STORAGE_KEY = 'scenario-tool-saved-scenarios'

export function loadSavedScenarios(): SavedScenario[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as SavedScenario[]
  } catch {
    return []
  }
}

export function saveSavedScenario(scenario: SavedScenario): void {
  const existing = loadSavedScenarios()
  existing.push(scenario)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function removeSavedScenario(id: string): void {
  const existing = loadSavedScenarios()
  const filtered = existing.filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
