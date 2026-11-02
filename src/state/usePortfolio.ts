/** Portfolio state hook with localStorage persistence and engine integration. */

import { useEffect, useMemo, useReducer, useRef } from 'react'
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
  const annualMWh = g.capacityMW * g.capacityFactor * 8760
  const total = g.shape.reduce((a, b) => a + b, 0)
  const generationMWh = total > 0 ? g.shape.map((v) => (v / total) * annualMWh) : g.shape.map(() => 0)
  return { id: g.uid, generationMWh }
}

/** Convert the portfolio matrix to the engine's AllocationMatrix format. */
function toEngineMatrix(matrix: PortfolioState['matrix']): AllocationMatrix {
  return matrix
}

function getInitialState(): PortfolioState {
  return loadPortfolio() ?? createDemoPortfolio()
}

export function usePortfolio() {
  const [state, dispatch] = useReducer(portfolioReducer, undefined, getInitialState)

  // Persist on every change
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    savePortfolio(state)
  }, [state])

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

  return { state, dispatch, engineResult }
}
