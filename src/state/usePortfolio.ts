/** Portfolio state hook with localStorage persistence and engine integration. */

import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { runEngine } from '../engine'
import type { AllocationMatrix, Consumer, EngineResult, Generator } from '../engine/types'
import { createDemoPortfolio } from './demoPortfolio'
import { loadPortfolio, savePortfolio } from './persistence'
import { portfolioReducer } from './portfolioReducer'
import type { PortfolioConsumer, PortfolioGenerator, PortfolioState } from './portfolioTypes'

/** Scale a normalised shape to absolute MWh for a consumer. */
function scaleConsumer(c: PortfolioConsumer): Consumer {
  const total = c.shape.reduce((a, b) => a + b, 0)
  const demandMWh = total > 0 ? c.shape.map((v) => (v / total) * c.annualMWh) : c.shape.map(() => 0)
  return { id: c.uid, demandMWh }
}

/** Scale a normalised shape to absolute MWh for a generator. */
function scaleGenerator(g: PortfolioGenerator): Generator {
  const total = g.shape.reduce((a, b) => a + b, 0)
  const generationMWh = total > 0 ? g.shape.map((v) => (v / total) * g.annualMWh) : g.shape.map(() => 0)
  return { id: g.uid, generationMWh }
}

/** Convert the portfolio matrix to the engine's AllocationMatrix format. */
function toEngineMatrix(matrix: PortfolioState['matrix']): AllocationMatrix {
  return matrix
}

/** Empty state used while the demo portfolio loads asynchronously. */
const EMPTY_STATE: PortfolioState = {
  consumers: [],
  generators: [],
  matrix: {},
  granularity: 'hourly',
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
  const engineResult: EngineResult | null = useMemo(() => {
    if (state.consumers.length === 0 || state.generators.length === 0) return null

    // Check if any generator has a non-zero allocation
    const hasAllocation = state.generators.some((g) => {
      const row = state.matrix[g.uid]
      return row && Object.values(row).some((v) => v > 0)
    })
    if (!hasAllocation) return null

    const consumers = state.consumers.map(scaleConsumer)
    const generators = state.generators.map(scaleGenerator)
    return runEngine({
      consumers,
      generators,
      matrix: toEngineMatrix(state.matrix),
      granularity: state.granularity,
    })
  }, [state.consumers, state.generators, state.matrix, state.granularity])

  return { state, dispatch, engineResult, loading }
}
