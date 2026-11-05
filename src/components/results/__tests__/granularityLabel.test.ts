import { describe, expect, it } from 'vitest'
import {
  granularityLabel,
  granularityInfo,
  granularityHeaderLine,
  SHAPE_PRESERVED_TOOLTIP,
} from '../granularityLabel'

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

  it('returns the full as-produced label', () => {
    expect(granularityLabel('as-produced')).toBe('As produced (no cap)')
  })
})

describe('granularityInfo', () => {
  it('returns cap and shape rules for each granularity', () => {
    expect(granularityInfo('hourly').capRule).toBe('capped at hourly consumption')
    expect(granularityInfo('hourly').shapeRule).toBe('no over-allocation possible')

    expect(granularityInfo('monthly').capRule).toBe('allocation capped at monthly consumption')
    expect(granularityInfo('monthly').shapeRule).toBe('generator shape preserved')

    expect(granularityInfo('annual').capRule).toBe('allocation capped at annual consumption')
    expect(granularityInfo('annual').shapeRule).toBe('generator shape preserved')

    expect(granularityInfo('as-produced').capRule).toBe('no cap')
    expect(granularityInfo('as-produced').shapeRule).toBe('generator shape preserved')
  })
})

describe('granularityHeaderLine', () => {
  it('returns the full header line for hourly', () => {
    expect(granularityHeaderLine('hourly')).toBe(
      'Hourly matching only · capped at hourly consumption · no over-allocation possible',
    )
  })

  it('returns the full header line for monthly', () => {
    expect(granularityHeaderLine('monthly')).toBe(
      'Monthly matching target · allocation capped at monthly consumption · generator shape preserved',
    )
  })

  it('returns the full header line for annual', () => {
    expect(granularityHeaderLine('annual')).toBe(
      'Annual matching target · allocation capped at annual consumption · generator shape preserved',
    )
  })

  it('returns the full header line for as-produced', () => {
    expect(granularityHeaderLine('as-produced')).toBe(
      'As produced (no cap) · no cap · generator shape preserved',
    )
  })
})

describe('SHAPE_PRESERVED_TOOLTIP', () => {
  it('explains shape preservation in clear terms', () => {
    expect(SHAPE_PRESERVED_TOOLTIP).toContain('hourly output shape')
    expect(SHAPE_PRESERVED_TOOLTIP).toContain('not redistributed')
  })
})
