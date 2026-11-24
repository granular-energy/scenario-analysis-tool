/** localStorage management for saved scenarios. */

import type { SavedScenario } from '../io/scenarioIO'

const STORAGE_KEY = 'sat-v3-scenarios'

/** Loads all saved scenarios from localStorage. Returns an empty array if none exist or on error. */
export function loadScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SavedScenario[]
  } catch {
    return []
  }
}

/** Overwrites the entire saved-scenarios list in localStorage. */
export function saveScenarios(scenarios: readonly SavedScenario[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
  } catch {
    // Silently ignore quota errors; the user can still use the tool
  }
}

/** Appends a single scenario to the saved list. */
export function addScenario(scenario: SavedScenario): void {
  const existing = loadScenarios()
  existing.push(scenario)
  saveScenarios(existing)
}

/** Removes a scenario by ID. No-op if the ID is not found. */
export function removeScenario(id: string): void {
  const existing = loadScenarios()
  const filtered = existing.filter((s) => s.id !== id)
  saveScenarios(filtered)
}

/** Renames a scenario by ID. No-op if the ID is not found. */
export function renameScenario(id: string, newName: string): void {
  const existing = loadScenarios()
  const updated = existing.map((s) => (s.id === id ? { ...s, name: newName } : s))
  saveScenarios(updated)
}

/** Retrieves a single scenario by ID, or null if not found. */
export function getScenario(id: string): SavedScenario | null {
  const all = loadScenarios()
  return all.find((s) => s.id === id) ?? null
}
