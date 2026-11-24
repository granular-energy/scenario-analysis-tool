/** Centralised HubSpot configuration for the sign-up gate. */

export const HUBSPOT_PORTAL_ID = '25772642'
export const HUBSPOT_REGION = 'eu1'
export const HUBSPOT_FORM_ID = 'REPLACE_WITH_FORM_ID'

/** The script URL for the HubSpot embedded form (v2 embed, EU region). */
export const HUBSPOT_EMBED_URL = 'https://js-eu1.hsforms.net/forms/embed/v2.js'

const PLACEHOLDER_FORM_ID = 'REPLACE_WITH_FORM_ID'

/**
 * Returns true when the HubSpot form ID has been set to a real value
 * (i.e. is not the placeholder string). When false, the gate shows a
 * development-mode bypass instead of the embedded form.
 */
export function isHubSpotConfigured(): boolean {
  return HUBSPOT_FORM_ID !== PLACEHOLDER_FORM_ID
}
