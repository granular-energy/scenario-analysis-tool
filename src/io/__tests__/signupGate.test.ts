import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SIGNUP_STORAGE_KEY, getSignedUpTimestamp, hasSignedUp, markSignedUp } from '../signupGate'

/** Minimal in-memory localStorage stub for Node tests. */
function createStorageStub(): Storage {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  }
}

describe('signupGate', () => {
  let storageStub: Storage

  beforeEach(() => {
    storageStub = createStorageStub()
    vi.stubGlobal('localStorage', storageStub)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('hasSignedUp', () => {
    it('returns false when no key is present', () => {
      expect(hasSignedUp()).toBe(false)
    })

    it('returns true when a valid ISO timestamp is stored', () => {
      storageStub.setItem(SIGNUP_STORAGE_KEY, '2026-11-24T10:30:00.000Z')
      expect(hasSignedUp()).toBe(true)
    })

    it('returns false for malformed values', () => {
      storageStub.setItem(SIGNUP_STORAGE_KEY, 'not-a-date')
      expect(hasSignedUp()).toBe(false)
    })

    it('returns false for empty string', () => {
      storageStub.setItem(SIGNUP_STORAGE_KEY, '')
      expect(hasSignedUp()).toBe(false)
    })

    it('returns false for a numeric value', () => {
      storageStub.setItem(SIGNUP_STORAGE_KEY, '12345')
      expect(hasSignedUp()).toBe(false)
    })
  })

  describe('markSignedUp', () => {
    it('writes a valid ISO timestamp to localStorage', () => {
      markSignedUp()
      const value = storageStub.getItem(SIGNUP_STORAGE_KEY)
      expect(value).toBeTruthy()
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('makes hasSignedUp return true', () => {
      markSignedUp()
      expect(hasSignedUp()).toBe(true)
    })
  })

  describe('getSignedUpTimestamp', () => {
    it('returns null when no key is present', () => {
      expect(getSignedUpTimestamp()).toBeNull()
    })

    it('returns null for malformed values', () => {
      storageStub.setItem(SIGNUP_STORAGE_KEY, 'garbage')
      expect(getSignedUpTimestamp()).toBeNull()
    })

    it('returns the stored timestamp when valid', () => {
      const ts = '2026-11-24T10:30:00.000Z'
      storageStub.setItem(SIGNUP_STORAGE_KEY, ts)
      expect(getSignedUpTimestamp()).toBe(ts)
    })
  })
})
