import { createContext } from 'react'
import type { PortfolioState, PortfolioAction } from '../types'

export const PortfolioContext = createContext<{
  state: PortfolioState
  dispatch: React.Dispatch<PortfolioAction>
} | null>(null)
