/** Hook to consume the portfolio context from any component. */

import { useContext } from 'react'
import type { PortfolioContextValue } from './PortfolioContext'
import { PortfolioCtx } from './portfolioCtx'

export function usePortfolioContext(): PortfolioContextValue {
  const ctx = useContext(PortfolioCtx)
  if (!ctx) throw new Error('usePortfolioContext must be used within PortfolioProvider')
  return ctx
}
