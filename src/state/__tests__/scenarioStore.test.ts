import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SavedScenario } from '../../io/scenarioIO'
import {
  addScenario,
  getScenario,
  loadScenarios,
  removeScenario,
  renameScenario,
  saveScenarios,
} from '../scenarioStore'

/** Builds a minimal saved scenario for testing. */
function makeSavedScenario(id: string, name: string): SavedScenario {
  return {
    id,
    name,
    savedAt: '2026-01-01T00:00:00.000Z',
    portfolio: {
      consumers: [],
      generators: [],
      matrix: {},
      granularity: 'hourly',
    },
    results: {
      hourlyScore: 67.33,
      annualScore: 100.74,
      totalExcessMWh: 1000,
      totalUnmatchedMWh: 2000,
      monthlyScores: [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76],
    },
  }
}

/** Simple in-memory mock for localStorage. */
function createMockStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key]
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

describe('scenarioStore', () => {
  let mockStorage: Storage

  beforeEach(() => {
    mockStorage = createMockStorage()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadScenarios', () => {
    it('returns an empty array when nothing is stored', () => {
      expect(loadScenarios()).toEqual([])
    })

    it('returns an empty array when stored value is invalid JSON', () => {
      mockStorage.setItem('sat-v3-scenarios', '{broken json')
      expect(loadScenarios()).toEqual([])
    })

    it('returns an empty array when stored value is not an array', () => {
      mockStorage.setItem('sat-v3-scenarios', '{"not":"array"}')
      expect(loadScenarios()).toEqual([])
    })
  })

  describe('saveScenarios / loadScenarios round-trip', () => {
    it('persists and retrieves scenarios', () => {
      const scenarios = [makeSavedScenario('a', 'Alpha'), makeSavedScenario('b', 'Beta')]
      saveScenarios(scenarios)
      const loaded = loadScenarios()
      expect(loaded).toHaveLength(2)
      expect(loaded[0].id).toBe('a')
      expect(loaded[0].name).toBe('Alpha')
      expect(loaded[1].id).toBe('b')
      expect(loaded[1].name).toBe('Beta')
    })
  })

  describe('addScenario', () => {
    it('appends a scenario to an empty store', () => {
      addScenario(makeSavedScenario('x', 'X'))
      const loaded = loadScenarios()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].id).toBe('x')
    })

    it('appends to existing scenarios', () => {
      saveScenarios([makeSavedScenario('a', 'A')])
      addScenario(makeSavedScenario('b', 'B'))
      const loaded = loadScenarios()
      expect(loaded).toHaveLength(2)
      expect(loaded[1].id).toBe('b')
    })
  })

  describe('removeScenario', () => {
    it('removes the scenario with the given ID', () => {
      saveScenarios([makeSavedScenario('a', 'A'), makeSavedScenario('b', 'B')])
      removeScenario('a')
      const loaded = loadScenarios()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].id).toBe('b')
    })

    it('is a no-op if the ID is not found', () => {
      saveScenarios([makeSavedScenario('a', 'A')])
      removeScenario('nonexistent')
      expect(loadScenarios()).toHaveLength(1)
    })
  })

  describe('renameScenario', () => {
    it('updates the name of a scenario', () => {
      saveScenarios([makeSavedScenario('a', 'Old name')])
      renameScenario('a', 'New name')
      const loaded = loadScenarios()
      expect(loaded[0].name).toBe('New name')
    })

    it('is a no-op if the ID is not found', () => {
      saveScenarios([makeSavedScenario('a', 'A')])
      renameScenario('nonexistent', 'whatever')
      expect(loadScenarios()[0].name).toBe('A')
    })

    it('does not change other scenarios', () => {
      saveScenarios([makeSavedScenario('a', 'A'), makeSavedScenario('b', 'B')])
      renameScenario('a', 'A2')
      const loaded = loadScenarios()
      expect(loaded[0].name).toBe('A2')
      expect(loaded[1].name).toBe('B')
    })
  })

  describe('getScenario', () => {
    it('returns the scenario with the given ID', () => {
      saveScenarios([makeSavedScenario('a', 'A'), makeSavedScenario('b', 'B')])
      const result = getScenario('b')
      expect(result).not.toBeNull()
      expect(result!.id).toBe('b')
      expect(result!.name).toBe('B')
    })

    it('returns null if the ID is not found', () => {
      saveScenarios([makeSavedScenario('a', 'A')])
      expect(getScenario('nonexistent')).toBeNull()
    })

    it('returns null from an empty store', () => {
      expect(getScenario('anything')).toBeNull()
    })
  })
})
