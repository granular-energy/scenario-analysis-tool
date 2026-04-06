import { useReducer } from 'react'
import type { ReactNode } from 'react'
import type { PortfolioState, PortfolioAction, AllocationMatrix } from '../types'
import { computeOverlapRange } from '../utils/timeseries'
import { PortfolioContext } from './portfolioContextValue'

const MAX_CONSUMERS = 5
const MAX_GENERATORS = 5

const initialState: PortfolioState = {
  consumers: [],
  generators: [],
  allocationMatrix: {},
  dateRange: null,
  activeTab: 'portfolio',
  selectedConsumerId: null,
  isAllocated: false,
}

function recomputeDateRange(state: PortfolioState): PortfolioState {
  const allProfiles = [...state.consumers, ...state.generators]
  const overlap = computeOverlapRange(allProfiles)
  return { ...state, dateRange: overlap, isAllocated: false }
}

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'ADD_PROFILE': {
      const { profile } = action
      if (profile.role === 'consumer') {
        if (state.consumers.length >= MAX_CONSUMERS) return state
        const consumers = [...state.consumers, profile]
        const allocationMatrix: AllocationMatrix = { ...state.allocationMatrix }
        for (const genId of Object.keys(allocationMatrix)) {
          allocationMatrix[genId] = { ...allocationMatrix[genId], [profile.id]: 0 }
        }
        return recomputeDateRange({
          ...state,
          consumers,
          allocationMatrix,
          selectedConsumerId: state.selectedConsumerId ?? profile.id,
        })
      } else {
        if (state.generators.length >= MAX_GENERATORS) return state
        const generators = [...state.generators, profile]
        const allocationMatrix: AllocationMatrix = { ...state.allocationMatrix }
        const consumerEntries: Record<string, number> = {}
        for (const c of state.consumers) {
          consumerEntries[c.id] = 0
        }
        allocationMatrix[profile.id] = consumerEntries
        return recomputeDateRange({ ...state, generators, allocationMatrix })
      }
    }

    case 'REMOVE_PROFILE': {
      const { id, role } = action
      if (role === 'consumer') {
        const consumers = state.consumers.filter((c) => c.id !== id)
        const allocationMatrix: AllocationMatrix = {}
        for (const [genId, allocations] of Object.entries(state.allocationMatrix)) {
          const { [id]: _removed, ...rest } = allocations
          void _removed
          allocationMatrix[genId] = rest
        }
        const selectedConsumerId =
          state.selectedConsumerId === id
            ? (consumers[0]?.id ?? null)
            : state.selectedConsumerId
        return recomputeDateRange({ ...state, consumers, allocationMatrix, selectedConsumerId })
      } else {
        const generators = state.generators.filter((g) => g.id !== id)
        const { [id]: _removedGen, ...allocationMatrix } = state.allocationMatrix
        void _removedGen
        return recomputeDateRange({ ...state, generators, allocationMatrix })
      }
    }

    case 'SET_ALLOCATION': {
      const { generatorId, consumerId, percentage } = action
      const clamped = Math.max(0, Math.min(100, percentage))
      const allocationMatrix: AllocationMatrix = { ...state.allocationMatrix }
      allocationMatrix[generatorId] = {
        ...allocationMatrix[generatorId],
        [consumerId]: clamped,
      }
      return { ...state, allocationMatrix, isAllocated: false }
    }

    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.range, isAllocated: false }

    case 'ALLOCATE':
      return { ...state, isAllocated: true }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }

    case 'SELECT_CONSUMER':
      return { ...state, selectedConsumerId: action.consumerId }

    default:
      return state
  }
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState)
  return (
    <PortfolioContext.Provider value={{ state, dispatch }}>
      {children}
    </PortfolioContext.Provider>
  )
}
