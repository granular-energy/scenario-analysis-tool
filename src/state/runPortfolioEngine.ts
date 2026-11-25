/** Single place that turns a PortfolioState into an engine run, so every view honours the allocation mode. */

import { runEngine } from '../engine'
import type { Consumer, EngineResult, Generator } from '../engine/types'
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

/** The matrix the current allocation mode reads from. */
export function activeMatrix(state: PortfolioState): PortfolioState['matrix'] {
  return state.allocationMode === 'consumption-share' ? state.consumptionMatrix : state.matrix
}

/** True when at least one generator has a non-zero entry in the active matrix. */
export function hasAnyAllocation(state: PortfolioState): boolean {
  const matrix = activeMatrix(state)
  return state.generators.some((g) => {
    const row = matrix[g.uid]
    return row !== undefined && Object.values(row).some((v) => v > 0)
  })
}

/** Run the engine for a portfolio, or return null when there is nothing to allocate. */
export function runPortfolioEngine(state: PortfolioState): EngineResult | null {
  if (state.consumers.length === 0 || state.generators.length === 0) return null
  if (!hasAnyAllocation(state)) return null
  return runEngine({
    consumers: state.consumers.map(scaleConsumer),
    generators: state.generators.map(scaleGenerator),
    matrix: state.matrix,
    granularity: state.granularity,
    allocationMode: state.allocationMode,
    consumptionMatrix: state.consumptionMatrix,
  })
}
