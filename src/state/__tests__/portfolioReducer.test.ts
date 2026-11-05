import { describe, expect, it } from 'vitest'
import { evenShares, portfolioReducer } from '../portfolioReducer'
import type { PortfolioConsumer, PortfolioGenerator, PortfolioState } from '../portfolioTypes'

function makeConsumer(uid: string, name = uid): PortfolioConsumer {
  return {
    uid,
    profileId: 'test',
    name,
    annualMWh: 1000,
    shape: new Array(8760).fill(1 / 8760),
    source: 'library',
  }
}

function makeGenerator(uid: string, name = uid): PortfolioGenerator {
  return {
    uid,
    profileId: 'test',
    name,
    annualMWh: 26280, // = 10 MW × 0.30 CF × 8760
    capacityFactor: 0.3,
    technology: 'wind-onshore',
    shape: new Array(8760).fill(1 / 8760),
    source: 'library',
  }
}

function emptyState(): PortfolioState {
  return { consumers: [], generators: [], matrix: {}, granularity: 'hourly' }
}

describe('evenShares', () => {
  it('returns [100] for 1 consumer', () => {
    expect(evenShares(1)).toEqual([100])
  })

  it('returns [50, 50] for 2 consumers', () => {
    expect(evenShares(2)).toEqual([50, 50])
  })

  it('returns shares summing to 100 for 3 consumers', () => {
    const shares = evenShares(3)
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100)
    // e.g. [34, 33, 33]
    expect(shares.every((s) => s === 33 || s === 34)).toBe(true)
  })

  it('returns [] for 0 consumers', () => {
    expect(evenShares(0)).toEqual([])
  })
})

describe('portfolioReducer', () => {
  it('adds a consumer and updates the matrix', () => {
    const state = emptyState()
    const gen = makeGenerator('g1')
    const withGen = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: gen })
    const consumer = makeConsumer('c1')
    const result = portfolioReducer(withGen, { type: 'ADD_CONSUMER', consumer })

    expect(result.consumers).toHaveLength(1)
    expect(result.matrix['g1']['c1']).toBe(0)
  })

  it('removes a consumer and removes it from the matrix', () => {
    let state = emptyState()
    state = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: makeGenerator('g1') })
    state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c1') })
    state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c2') })
    state = portfolioReducer(state, {
      type: 'SET_ALLOCATION',
      generatorUid: 'g1',
      consumerUid: 'c1',
      percent: 50,
    })

    const result = portfolioReducer(state, { type: 'REMOVE_CONSUMER', uid: 'c1' })
    expect(result.consumers).toHaveLength(1)
    expect(result.matrix['g1']['c1']).toBeUndefined()
    expect(result.matrix['g1']['c2']).toBe(0)
  })

  it('enforces max 5 consumers', () => {
    let state = emptyState()
    for (let i = 0; i < 5; i++) {
      state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer(`c${i}`) })
    }
    expect(state.consumers).toHaveLength(5)

    const result = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c5') })
    expect(result.consumers).toHaveLength(5)
  })

  it('enforces max 5 generators', () => {
    let state = emptyState()
    for (let i = 0; i < 5; i++) {
      state = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: makeGenerator(`g${i}`) })
    }
    expect(state.generators).toHaveLength(5)

    const result = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: makeGenerator('g5') })
    expect(result.generators).toHaveLength(5)
  })

  it('clamps allocation to 0-100', () => {
    let state = emptyState()
    state = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: makeGenerator('g1') })
    state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c1') })

    const over = portfolioReducer(state, {
      type: 'SET_ALLOCATION',
      generatorUid: 'g1',
      consumerUid: 'c1',
      percent: 150,
    })
    expect(over.matrix['g1']['c1']).toBe(100)

    const under = portfolioReducer(state, {
      type: 'SET_ALLOCATION',
      generatorUid: 'g1',
      consumerUid: 'c1',
      percent: -10,
    })
    expect(under.matrix['g1']['c1']).toBe(0)
  })

  it('allocates evenly across consumers', () => {
    let state = emptyState()
    state = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: makeGenerator('g1') })
    state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c1') })
    state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c2') })

    const result = portfolioReducer(state, { type: 'ALLOCATE_EVENLY' })
    expect(result.matrix['g1']['c1']).toBe(50)
    expect(result.matrix['g1']['c2']).toBe(50)
  })

  it('updates consumer sizing', () => {
    let state = emptyState()
    state = portfolioReducer(state, { type: 'ADD_CONSUMER', consumer: makeConsumer('c1') })
    const result = portfolioReducer(state, {
      type: 'UPDATE_CONSUMER_SIZING',
      uid: 'c1',
      annualMWh: 5000,
    })
    expect(result.consumers[0].annualMWh).toBe(5000)
  })

  it('updates generator sizing', () => {
    let state = emptyState()
    state = portfolioReducer(state, { type: 'ADD_GENERATOR', generator: makeGenerator('g1') })
    const result = portfolioReducer(state, {
      type: 'UPDATE_GENERATOR_SIZING',
      uid: 'g1',
      annualMWh: 50000,
    })
    expect(result.generators[0].annualMWh).toBe(50000)
  })

  it('sets granularity', () => {
    const state = emptyState()
    const result = portfolioReducer(state, { type: 'SET_GRANULARITY', granularity: 'monthly' })
    expect(result.granularity).toBe('monthly')
  })
})
