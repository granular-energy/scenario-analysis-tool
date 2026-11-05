import type { PortfolioAction, PortfolioMatrix, PortfolioState } from './portfolioTypes'
import { MAX_CONSUMERS, MAX_GENERATORS } from './portfolioTypes'

/** Remove a consumer column from every generator row in the matrix. */
function removeConsumerFromMatrix(matrix: PortfolioMatrix, uid: string): PortfolioMatrix {
  const next: PortfolioMatrix = {}
  for (const [gUid, row] of Object.entries(matrix)) {
    const { [uid]: _, ...rest } = row
    next[gUid] = rest
  }
  return next
}

/** Remove a generator row from the matrix. */
function removeGeneratorFromMatrix(matrix: PortfolioMatrix, uid: string): PortfolioMatrix {
  const { [uid]: _, ...rest } = matrix
  return rest
}

/** Add a new generator row with all-zero allocations. */
function addGeneratorToMatrix(
  matrix: PortfolioMatrix,
  generatorUid: string,
  consumerUids: readonly string[],
): PortfolioMatrix {
  const row: Record<string, number> = {}
  for (const cUid of consumerUids) row[cUid] = 0
  return { ...matrix, [generatorUid]: row }
}

/** Add a new consumer column (zero) to every generator row. */
function addConsumerToMatrix(matrix: PortfolioMatrix, consumerUid: string): PortfolioMatrix {
  const next: PortfolioMatrix = {}
  for (const [gUid, row] of Object.entries(matrix)) {
    next[gUid] = { ...row, [consumerUid]: 0 }
  }
  return next
}

export function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'ADD_CONSUMER': {
      if (state.consumers.length >= MAX_CONSUMERS) return state
      return {
        ...state,
        consumers: [...state.consumers, action.consumer],
        matrix: addConsumerToMatrix(state.matrix, action.consumer.uid),
      }
    }
    case 'REMOVE_CONSUMER': {
      return {
        ...state,
        consumers: state.consumers.filter((c) => c.uid !== action.uid),
        matrix: removeConsumerFromMatrix(state.matrix, action.uid),
      }
    }
    case 'UPDATE_CONSUMER_SIZING': {
      return {
        ...state,
        consumers: state.consumers.map((c) =>
          c.uid === action.uid ? { ...c, annualMWh: action.annualMWh } : c,
        ),
      }
    }
    case 'ADD_GENERATOR': {
      if (state.generators.length >= MAX_GENERATORS) return state
      const consumerUids = state.consumers.map((c) => c.uid)
      return {
        ...state,
        generators: [...state.generators, action.generator],
        matrix: addGeneratorToMatrix(state.matrix, action.generator.uid, consumerUids),
      }
    }
    case 'REMOVE_GENERATOR': {
      return {
        ...state,
        generators: state.generators.filter((g) => g.uid !== action.uid),
        matrix: removeGeneratorFromMatrix(state.matrix, action.uid),
      }
    }
    case 'UPDATE_GENERATOR_SIZING': {
      return {
        ...state,
        generators: state.generators.map((g) =>
          g.uid === action.uid ? { ...g, annualMWh: action.annualMWh } : g,
        ),
      }
    }
    case 'SET_ALLOCATION': {
      const clamped = Math.max(0, Math.min(100, action.percent))
      const row = state.matrix[action.generatorUid] ?? {}
      return {
        ...state,
        matrix: {
          ...state.matrix,
          [action.generatorUid]: { ...row, [action.consumerUid]: clamped },
        },
      }
    }
    case 'ALLOCATE_EVENLY': {
      const n = state.consumers.length
      if (n === 0) return state
      const shares = evenShares(n)
      const matrix: PortfolioMatrix = {}
      for (const g of state.generators) {
        const row: Record<string, number> = {}
        state.consumers.forEach((c, i) => {
          row[c.uid] = shares[i]
        })
        matrix[g.uid] = row
      }
      return { ...state, matrix }
    }
    case 'SET_GRANULARITY': {
      return { ...state, granularity: action.granularity }
    }
    case 'LOAD_STATE': {
      return action.state
    }
  }
}

/** Distribute 100 % evenly across n consumers, rounding to integers that sum to 100. */
export function evenShares(n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(100 / n)
  const remainder = 100 - base * n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}
