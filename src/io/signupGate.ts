/**
 * Sign-up gate state helpers.
 *
 * The gate uses a dedicated localStorage key (with a dot, not the sat-v3- prefix
 * used by portfolio/scenario stores) to remember whether the user has completed
 * the HubSpot sign-up form. The value is an ISO 8601 timestamp of when the
 * form was submitted (or the dev-mode bypass was clicked).
 */

const STORAGE_KEY = 'scenario-tool.signedUp'

/** Returns true when the user has previously completed the sign-up gate. */
export function hasSignedUp(): boolean {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return false
    // Must look like an ISO 8601 date string (starts with YYYY-MM-DDT)
    return /^\d{4}-\d{2}-\d{2}T/.test(value)
  } catch {
    return false
  }
}

/** Mark the user as signed up with the current timestamp. */
export function markSignedUp(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  } catch {
    // Silently ignore quota errors
  }
}

/**
 * Read the raw signed-up timestamp from localStorage.
 * Returns null if absent or malformed.
 */
export function getSignedUpTimestamp(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return null
    if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return null
    return value
  } catch {
    return null
  }
}

/** The localStorage key used by the gate, exported for test setup. */
export const SIGNUP_STORAGE_KEY = STORAGE_KEY
