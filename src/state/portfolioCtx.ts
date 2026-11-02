/** Bare context object — separated so the React Fast Refresh lint is happy. */

import { createContext } from 'react'
import type { PortfolioContextValue } from './PortfolioContext'

export const PortfolioCtx = createContext<PortfolioContextValue | null>(null)
