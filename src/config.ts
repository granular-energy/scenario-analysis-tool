/** Centralised HubSpot configuration for the sign-up gate. */

export const HUBSPOT_PORTAL_ID = '25772642'
export const HUBSPOT_REGION = 'eu1'

const PLACEHOLDER_FORM_ID = 'REPLACE_WITH_FORM_ID'

/** The published "Scenario Analysis Tool sign-up" form in the Granular HubSpot portal. */
const DEFAULT_FORM_ID = '8aa9943b-d138-4200-bc7e-d61b3465a59b'

/**
 * Form ID in use. `VITE_HUBSPOT_FORM_ID` overrides the default so test builds can
 * force the placeholder (development mode) without touching the production value.
 */
export const HUBSPOT_FORM_ID: string = import.meta.env.VITE_HUBSPOT_FORM_ID || DEFAULT_FORM_ID

/**
 * Per-portal embed script. Forms built in HubSpot's current editor render through this
 * script (it hydrates every `.hs-form-frame` element on the page); the older
 * `forms/embed/v2.js` API does not render them.
 */
export const HUBSPOT_EMBED_URL = `https://js-${HUBSPOT_REGION}.hsforms.net/forms/embed/${HUBSPOT_PORTAL_ID}.js`

/**
 * Returns true when the HubSpot form ID is a real value rather than the placeholder.
 * When false, the gate shows a development-mode bypass instead of the embedded form.
 */
export function isHubSpotConfigured(): boolean {
  return HUBSPOT_FORM_ID !== PLACEHOLDER_FORM_ID
}
