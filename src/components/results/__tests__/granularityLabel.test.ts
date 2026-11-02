import { describe, expect, it } from 'vitest'
import { granularityLabel } from '../granularityLabel'

describe('granularityLabel', () => {
  it('returns hourly description', () => {
    expect(granularityLabel('hourly')).toContain('Hourly')
    expect(granularityLabel('hourly')).toContain('shape preserved')
  })

  it('returns monthly description', () => {
    expect(granularityLabel('monthly')).toContain('Monthly')
    expect(granularityLabel('monthly')).toContain('shape preserved')
  })

  it('returns annual description', () => {
    expect(granularityLabel('annual')).toContain('Annual')
    expect(granularityLabel('annual')).toContain('shape preserved')
  })
})
