/** localStorage persistence for the portfolio state. */

import type { PortfolioState } from './portfolioTypes'

const STORAGE_KEY = 'sat-v3-portfolio'

export function savePortfolio(state: PortfolioState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Silently ignore quota errors; the user can still use the tool
  }
}

export function loadPortfolio(): PortfolioState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PortfolioState
  } catch {
    return null
  }
}

export function clearPortfolio(): void {
  localStorage.removeItem(STORAGE_KEY)
}
