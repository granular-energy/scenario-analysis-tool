import type { Profile } from '../types'

const STORAGE_KEY = 'scenario-tool-custom-profiles'

export function loadCustomProfiles(): Profile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as Profile[]
  } catch {
    return []
  }
}

export function saveCustomProfile(profile: Profile): void {
  const existing = loadCustomProfiles()
  existing.push(profile)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function removeCustomProfile(id: string): void {
  const existing = loadCustomProfiles()
  const filtered = existing.filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
