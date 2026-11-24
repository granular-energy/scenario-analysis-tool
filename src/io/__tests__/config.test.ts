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

  it('exports the placeholder form ID', () => {
    expect(HUBSPOT_FORM_ID).toBe('REPLACE_WITH_FORM_ID')
  })

  it('exports the correct embed URL', () => {
    expect(HUBSPOT_EMBED_URL).toBe('https://js-eu1.hsforms.net/forms/embed/v2.js')
  })

  it('isHubSpotConfigured returns false for the placeholder form ID', () => {
    // With the placeholder value, the form is not configured
    expect(isHubSpotConfigured()).toBe(false)
  })
})
