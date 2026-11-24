# Milestone M6 brief: HubSpot sign-up gate

Goal: the hosted tool is public, but a visitor must complete a HubSpot sign-up form once before using it.

In scope:
- Gate the whole app on first visit: a full-screen modal over the (blurred, non-interactive) tool that explains in two sentences what the tool does and asks the visitor to sign up to use it. Granular style, mobile-friendly at 375px, keyboard accessible, focus trapped inside the modal.
- The modal embeds a HubSpot form using the official v2 embed script (`https://js-eu1.hsforms.net/forms/embed/v2.js`, region `eu1`, portal ID `25772642`, form ID from `src/config.ts`). The form ID is a placeholder constant until marketing supplies it; when the placeholder is in use show a small "Development mode: sign-up form not configured" notice and a "Continue without signing up" button so the tool stays usable locally and in tests.
- On HubSpot's `onFormSubmitted` callback (and on the development-mode button) set `localStorage['scenario-tool.signedUp'] = ISO timestamp`, close the modal and unlock the tool. The flag persists; a returning visitor is not asked again. Also honour `?signedUp=1` in the URL for internal demos (sets the same flag).
- If the HubSpot script fails to load within 5 s (ad blocker, offline), show a plain message with a link to granular-energy.com/contact and keep the tool locked; no silent fallthrough.
- Config: `src/config.ts` exports `HUBSPOT_PORTAL_ID`, `HUBSPOT_REGION`, `HUBSPOT_FORM_ID` (placeholder `'REPLACE_WITH_FORM_ID'`) and `isHubSpotConfigured()`. README documents how to set the form ID and where to find it in HubSpot.
- Tests: unit tests for the gate state logic; e2e tests that (a) the modal shows on a fresh visit, (b) the development-mode continue button unlocks and persists across reload, (c) `?signedUp=1` bypasses, (d) the existing suites keep passing — set the flag in each spec's `beforeEach` alongside the existing `localStorage.clear()` so they are not blocked by the gate.
- Keep PDF downloads ungated (the whole-app gate replaces the per-download gate from the original M4 brief).

Out of scope: server-side verification, accounts, storing the submitted data anywhere other than HubSpot, changes to the engine or any existing tab.

Context: Allocation tab selector is "Allocation method"; annual score is volumetric; Playwright always builds before serving and no separate preview may be started on port 4173 during evaluation.
