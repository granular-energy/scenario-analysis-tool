import { describe, expect, it } from 'vitest'
import { granularityLabel } from '../granularityLabel'

describe('granularityLabel', () => {
  it('returns the full hourly label', () => {
    expect(granularityLabel('hourly')).toBe('Hourly matching only')
  })

  it('returns the full monthly label', () => {
    expect(granularityLabel('monthly')).toBe('Monthly matching target')
  })

  it('returns the full annual label', () => {
    expect(granularityLabel('annual')).toBe('Annual matching target')
  })
})
