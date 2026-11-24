import { describe, expect, it } from 'vitest'
import { allocateToConsumer } from '../allocate'
import { runEngine } from '../score'
import { MONTH_START_HOUR, monthOfSlot, slotFor, sumByMonth } from '../typicalYear'
import { HOURS_PER_YEAR } from '../types'

function flat(value: number): number[] {
  return new Array<number>(HOURS_PER_YEAR).fill(value)
}

/** A daytime-only shape: `value` from 08:00 to 16:00, zero otherwise. */
function daytime(value: number): number[] {
  return flat(0).map((_, h) => (h % 24 >= 8 && h % 24 < 16 ? value : 0))
}

describe('typical year', () => {
  it('has 8,760 hours across 12 months', () => {
    expect(MONTH_START_HOUR[12]).toBe(HOURS_PER_YEAR)
    expect(MONTH_START_HOUR[1]).toBe(744)
    expect(MONTH_START_HOUR[2]).toBe(744 + 672)
  })

  it('maps calendar positions to slots and back', () => {
    expect(slotFor(1, 1, 0)).toBe(0)
    expect(slotFor(2, 1, 0)).toBe(744)
    expect(slotFor(12, 31, 23)).toBe(HOURS_PER_YEAR - 1)
    expect(slotFor(2, 29, 0)).toBe(-1)
    expect(monthOfSlot(0)).toBe(0)
    expect(monthOfSlot(743)).toBe(0)
    expect(monthOfSlot(744)).toBe(1)
    expect(monthOfSlot(HOURS_PER_YEAR - 1)).toBe(11)
  })

  it('sums by month', () => {
    const monthly = sumByMonth(flat(1))
    expect(monthly[0]).toBe(744)
    expect(monthly[1]).toBe(672)
    expect(monthly.reduce((a, b) => a + b, 0)).toBe(HOURS_PER_YEAR)
  })
})

describe('allocateToConsumer', () => {
  it('hourly granularity is per-hour min(supply, demand)', () => {
    const demand = flat(10)
    const [allocated] = allocateToConsumer(demand, [{ generatorId: 'g', supplyMWh: daytime(30) }], 'hourly')
    expect(allocated[8]).toBe(10)
    expect(allocated[0]).toBe(0)
  })

  it('monthly granularity keeps the generator shape and allows hourly excess', () => {
    const demand = flat(10) // 7,440 MWh in January
    const supply = daytime(15) // 8 h × 15 × 31 = 3,720 MWh in January: half the demand
    const [allocated] = allocateToConsumer(demand, [{ generatorId: 'g', supplyMWh: supply }], 'monthly')
    // Whole supply is allocated, in its own shape: 15 MWh at daytime hours despite demand being 10
    expect(allocated[8]).toBeCloseTo(15, 9)
    expect(allocated[0]).toBe(0)
    const january = allocated.slice(0, 744).reduce((a, b) => a + b, 0)
    expect(january).toBeCloseTo(3720, 6)
  })

  it('caps allocation at window demand and serves the largest generator first', () => {
    const demand = flat(10) // 87,600 MWh/yr
    const big = flat(8) // 70,080
    const small = flat(4) // 35,040
    const [bigAlloc, smallAlloc] = allocateToConsumer(
      demand,
      [
        { generatorId: 'small', supplyMWh: small },
        { generatorId: 'big', supplyMWh: big },
      ].reverse(),
      'annual',
    )
    const total = (s: number[]) => s.reduce((a, b) => a + b, 0)
    expect(total(bigAlloc)).toBeCloseTo(70080, 6)
    expect(total(smallAlloc)).toBeCloseTo(87600 - 70080, 6)
    expect(smallAlloc[0]).toBeCloseTo(((87600 - 70080) / 35040) * 4, 9)
  })

  it('as-produced assigns full supply with no cap at demand', () => {
    const demand = flat(10)
    const supply = flat(30)
    const [allocated] = allocateToConsumer(demand, [{ generatorId: 'g', supplyMWh: supply }], 'as-produced')
    // No capping: every hour gets the full supply (30), even though demand is only 10
    expect(allocated[0]).toBe(30)
    expect(allocated[100]).toBe(30)
    const total = allocated.reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(30 * HOURS_PER_YEAR, 6)
  })

  it('as-produced with daytime supply follows supply shape', () => {
    const demand = flat(10)
    const supply = daytime(20)
    const [allocated] = allocateToConsumer(demand, [{ generatorId: 'g', supplyMWh: supply }], 'as-produced')
    // Full supply is allocated: 20 during daytime, 0 at night
    expect(allocated[8]).toBe(20)
    expect(allocated[0]).toBe(0)
  })

  it('ignores negligible supply', () => {
    const [allocated] = allocateToConsumer(
      flat(10),
      [{ generatorId: 'g', supplyMWh: flat(0.0000001) }],
      'annual',
    )
    expect(allocated.every((v) => v === 0)).toBe(true)
  })
})

describe('runEngine', () => {
  const consumers = [
    { id: 'a', demandMWh: flat(10) },
    { id: 'b', demandMWh: flat(5) },
  ]
  const generators = [{ id: 'g', generationMWh: flat(20) }]

  it('splits a generator by the matrix and reports utilisation', () => {
    const result = runEngine({
      consumers,
      generators,
      matrix: { g: { a: 50, b: 25 } },
      granularity: 'hourly',
    })
    const a = result.consumers[0]
    const b = result.consumers[1]
    expect(a.hourlyScore).toBeCloseTo(100, 9) // 10 MWh of supply for 10 MWh demand
    expect(b.hourlyScore).toBeCloseTo(100, 9) // 5 for 5
    expect(a.annualScore).toBeCloseTo(100, 9)
    expect(a.totalSuppliedMWh).toBeCloseTo(10 * HOURS_PER_YEAR, 3)
    expect(a.totalExcessMWh).toBeCloseTo(0, 6)
    const g = result.generators[0]
    expect(g.allocatedMWh).toBeCloseTo(15 * HOURS_PER_YEAR, 3)
    expect(g.unallocatedMWh).toBeCloseTo(5 * HOURS_PER_YEAR, 3)
    expect(result.portfolio.hourlyScore).toBeCloseTo(100, 9)
  })

  it('reports excess and unmatched when supply and demand shapes differ', () => {
    const result = runEngine({
      consumers: [{ id: 'a', demandMWh: flat(10) }],
      generators: [{ id: 'g', generationMWh: daytime(30) }],
      matrix: { g: { a: 100 } },
      granularity: 'annual',
    })
    const a = result.consumers[0]
    expect(a.annualScore).toBeCloseTo(100, 9) // 8h × 30 = 240/day = 10 × 24
    expect(a.hourlyScore).toBeCloseTo((8 / 24) * 100, 9) // only daytime hours are covered
    expect(a.totalExcessMWh).toBeCloseTo(20 * 8 * 365, 3)
    expect(a.totalUnmatchedMWh).toBeCloseTo(10 * 16 * 365, 3)
    expect(a.generators[0].totalMatchedMWh).toBeCloseTo(a.totalMatchedMWh, 6)
  })

  it('as-produced shows excess when supply exceeds demand', () => {
    const result = runEngine({
      consumers: [{ id: 'a', demandMWh: flat(10) }],
      generators: [{ id: 'g', generationMWh: flat(30) }],
      matrix: { g: { a: 100 } },
      granularity: 'as-produced',
    })
    const a = result.consumers[0]
    // Full 30 MWh/h allocated → 10 matched, 20 excess per hour
    expect(a.totalAllocatedMWh).toBeCloseTo(30 * HOURS_PER_YEAR, 3)
    expect(a.totalMatchedMWh).toBeCloseTo(10 * HOURS_PER_YEAR, 3)
    expect(a.totalExcessMWh).toBeCloseTo(20 * HOURS_PER_YEAR, 3)
    expect(a.totalUnmatchedMWh).toBeCloseTo(0, 6)
    expect(a.hourlyScore).toBeCloseTo(100, 9)
    expect(a.annualScore).toBeCloseTo(300, 9) // 30/10 × 100 = 300%
  })

  it('handles a consumer with no allocated generators', () => {
    const result = runEngine({ consumers, generators, matrix: {}, granularity: 'monthly' })
    expect(result.consumers[0].hourlyScore).toBe(0)
    expect(result.consumers[0].generators).toHaveLength(0)
    expect(result.generators[0].unallocatedMWh).toBeCloseTo(20 * HOURS_PER_YEAR, 3)
  })

  it('runs a 5×5 hourly portfolio quickly', () => {
    const five = (prefix: string, v: number) =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `${prefix}${i}`,
        demandMWh: flat(v),
        generationMWh: daytime(v),
      }))
    const matrix = Object.fromEntries(
      five('g', 1).map((g) => [g.id, Object.fromEntries(five('c', 1).map((c) => [c.id, 20]))]),
    )
    // Warmup run to let the JIT optimise hot paths before timing
    runEngine({ consumers: five('c', 10), generators: five('g', 30), matrix, granularity: 'hourly' })
    const started = performance.now()
    runEngine({ consumers: five('c', 10), generators: five('g', 30), matrix, granularity: 'hourly' })
    expect(performance.now() - started).toBeLessThan(50)
  })
})
