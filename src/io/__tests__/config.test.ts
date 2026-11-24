import { describe, expect, it } from 'vitest'
import {
  HUBSPOT_EMBED_URL,
  HUBSPOT_FORM_ID,
  HUBSPOT_PORTAL_ID,
  HUBSPOT_REGION,
  isHubSpotConfigured,
} from '../../config'

describe('config', () => {
  it('exports the correct portal ID', () => {
    expect(HUBSPOT_PORTAL_ID).toBe('25772642')
  })

  it('exports the correct region', () => {
    expect(HUBSPOT_REGION).toBe('eu1')
  })

  it('exports the published sign-up form ID by default', () => {
    expect(HUBSPOT_FORM_ID).toBe('8aa9943b-d138-4200-bc7e-d61b3465a59b')
  })

  it('exports the per-portal embed script URL', () => {
    expect(HUBSPOT_EMBED_URL).toBe('https://js-eu1.hsforms.net/forms/embed/25772642.js')
  })

  it('isHubSpotConfigured returns true for the real form ID', () => {
    expect(isHubSpotConfigured()).toBe(true)
  })
})
