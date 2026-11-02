import { describe, expect, it } from 'vitest'
import { techAllocatedColour, techExcessColour, TECH_COLOURS, DEMAND_COLOUR } from '../palette'

describe('techAllocatedColour', () => {
  it('returns solar allocated colour', () => {
    expect(techAllocatedColour('solar')).toBe('#FDCF77')
  })

  it('returns wind-onshore allocated colour', () => {
    expect(techAllocatedColour('wind-onshore')).toBe('#58CAA1')
  })

  it('falls back to unknown for unrecognised tech', () => {
    expect(techAllocatedColour('fusion')).toBe(TECH_COLOURS['unknown'].allocated)
  })
})

describe('techExcessColour', () => {
  it('returns solar excess colour', () => {
    expect(techExcessColour('solar')).toBe('#FEE0A7')
  })

  it('falls back to unknown for unrecognised tech', () => {
    expect(techExcessColour('tidal')).toBe(TECH_COLOURS['unknown'].excess)
  })
})

describe('DEMAND_COLOUR', () => {
  it('is the deep navy value from the design system', () => {
    expect(DEMAND_COLOUR).toBe('#0F4974')
  })
})
