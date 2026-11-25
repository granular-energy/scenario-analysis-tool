/** Portfolio state hook with localStorage persistence and engine integration. */

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { EngineResult } from '../engine/types'
import { createDemoPortfolio } from './demoPortfolio'
import { loadPortfolio, savePortfolio } from './persistence'
import { portfolioReducer } from './portfolioReducer'
import type { PortfolioState } from './portfolioTypes'
import { runPortfolioEngine } from './runPortfolioEngine'

/** Empty state used while the demo portfolio loads asynchronously. */
const EMPTY_STATE: PortfolioState = {
  consumers: [],
  generators: [],
  matrix: {},
  granularity: 'hourly',
  allocationMode: 'generator-share',
  consumptionMatrix: {},
}

/**
 * Resolve initial state from localStorage.
 * Returns the persisted state and a flag indicating whether the demo is needed.
 */
function getInitialState(): { state: PortfolioState; needsDemo: boolean } {
  const persisted = loadPortfolio()
  if (persisted) return { state: persisted, needsDemo: false }
  return { state: EMPTY_STATE, needsDemo: true }
}

export function usePortfolio() {
  // useState lazy initialiser runs once and captures whether we need the demo
  const [needsDemo] = useState(() => getInitialState().needsDemo)
  const [loading, setLoading] = useState(needsDemo)
  const [state, dispatch] = useReducer(portfolioReducer, undefined, () => getInitialState().state)

  // Load the async demo portfolio when no localStorage data existed on mount
  useEffect(() => {
    if (!needsDemo) return
    void createDemoPortfolio().then((demo) => {
      dispatch({ type: 'LOAD_STATE', state: demo })
      setLoading(false)
    })
  }, [needsDemo])

  // Persist on every change (skip the initial empty state while loading)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!loading) {
      savePortfolio(state)
    }
  }, [state, loading])

  // Run the engine whenever inputs change
  const engineResult: EngineResult | null = useMemo(
    () => runPortfolioEngine(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the inputs the engine reads
    [
      state.consumers,
      state.generators,
      state.matrix,
      state.granularity,
      state.allocationMode,
      state.consumptionMatrix,
    ],
  )

  return { state, dispatch, engineResult, loading }
}
