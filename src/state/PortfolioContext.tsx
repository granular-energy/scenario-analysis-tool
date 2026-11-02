/** React context provider for portfolio state, dispatch, and engine results. */

import type { ReactNode } from 'react'
import type { EngineResult } from '../engine/types'
import type { PortfolioAction, PortfolioState } from './portfolioTypes'
import { PortfolioCtx } from './portfolioCtx'
import { usePortfolio } from './usePortfolio'

export interface PortfolioContextValue {
  state: PortfolioState
  dispatch: (action: PortfolioAction) => void
  engineResult: EngineResult | null
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const value = usePortfolio()
  return <PortfolioCtx.Provider value={value}>{children}</PortfolioCtx.Provider>
}
