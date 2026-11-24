import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HUBSPOT_EMBED_URL,
  HUBSPOT_FORM_ID,
  HUBSPOT_PORTAL_ID,
  HUBSPOT_REGION,
  isHubSpotConfigured,
} from '../../config'
import { hasSignedUp, markSignedUp } from '../../io/signupGate'

type GateState = 'loading' | 'form' | 'dev' | 'error' | 'dismissed'

/**
 * Full-screen sign-up gate that blocks the app on first visit.
 *
 * Always attempts to load the HubSpot embed script first. If the script
 * loads successfully and the form ID is configured, the embedded form
 * (an iframe hydrated by the script) is shown and submission is detected
 * through HubSpot's `hsFormCallback` postMessage events. If the script loads but the form ID is a placeholder, the
 * development-mode bypass is shown. If the script fails to load (network
 * blocked or 5-second timeout), the error fallback is shown with a contact
 * link and no bypass — the tool remains locked.
 */
export function SignUpGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>(() => {
    // Check the ?signedUp=1 query parameter
    const params = new URLSearchParams(window.location.search)
    if (params.get('signedUp') === '1') {
      if (!hasSignedUp()) {
        markSignedUp()
      }
      return 'dismissed'
    }
    if (hasSignedUp()) return 'dismissed'
    // Always start loading — the script must load before we can decide
    // whether to show the form or the dev-mode bypass
    return 'loading'
  })

  const modalRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the HubSpot embed script. On success, branch on isHubSpotConfigured().
  useEffect(() => {
    if (state !== 'loading') return

    const script = document.createElement('script')
    script.src = HUBSPOT_EMBED_URL
    script.async = true

    // 5-second timeout — if the script has not loaded by then, show error
    timeoutRef.current = setTimeout(() => {
      setState('error')
    }, 5000)

    script.onload = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      // The script hydrates the `.hs-form-frame` element already in the DOM; with the
      // placeholder ID that element is not rendered and the dev bypass is shown instead.
      setState(isHubSpotConfigured() ? 'form' : 'dev')
    }

    script.onerror = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setState('error')
    }

    document.head.appendChild(script)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [state])

  // The embedded form runs in an iframe and reports back via postMessage.
  useEffect(() => {
    if (state !== 'loading' && state !== 'form') return

    function handleMessage(e: MessageEvent) {
      const data = e.data as { type?: string; eventName?: string } | null
      if (!data || data.type !== 'hsFormCallback') return
      if (data.eventName === 'onFormSubmitted') {
        markSignedUp()
        setState('dismissed')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [state])

  // Focus trap: keep focus inside the modal
  useEffect(() => {
    if (state === 'dismissed') return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const modal = modalRef.current
      if (!modal) return

      const focusable = modal.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) {
        // No focusable elements — block Tab entirely
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      // If focus is outside the modal, redirect it inside
      if (!modal.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
        return
      }

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state])

  // Auto-focus first focusable element on modal open
  useEffect(() => {
    if (state === 'dismissed') return
    const modal = modalRef.current
    if (!modal) return

    // Small delay to ensure content is rendered
    const id = requestAnimationFrame(() => {
      const focusable = modal.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    })
    return () => cancelAnimationFrame(id)
  }, [state])

  const handleContinue = useCallback(() => {
    markSignedUp()
    setState('dismissed')
  }, [])

  if (state === 'dismissed') {
    return <>{children}</>
  }

  return (
    <>
      {/* Blurred, non-interactive app content behind the gate */}
      <div className="signup-gate__backdrop">{children}</div>

      {/* Modal overlay */}
      <div
        className="signup-gate__overlay"
        data-testid="signup-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sign up to use the Scenario Analysis Tool"
      >
        <div className="signup-gate__card" ref={modalRef}>
          <div className="signup-gate__brand">
            <img
              src="/brand/granular-wave.svg"
              alt="Granular Energy"
              className="signup-gate__logo"
              width={28}
              height={28}
            />
            <h2 className="signup-gate__title">Scenario Analysis Tool</h2>
          </div>
          <p className="signup-gate__description">
            Explore how well renewable generation matches your electricity demand across different
            time-matching methods. Build a portfolio, set allocations, and compare scenarios.
          </p>

          {state === 'dev' && (
            <div className="signup-gate__dev">
              <p className="signup-gate__dev-notice">
                Development mode — the HubSpot form ID has not been configured yet.
              </p>
              <button
                type="button"
                className="btn-primary signup-gate__continue-btn"
                onClick={handleContinue}
              >
                Continue without signing up
              </button>
            </div>
          )}

          {(state === 'loading' || state === 'form') && (
            <div className="signup-gate__form" data-testid="signup-form">
              {isHubSpotConfigured() && (
                <div
                  className="hs-form-frame"
                  data-region={HUBSPOT_REGION}
                  data-form-id={HUBSPOT_FORM_ID}
                  data-portal-id={HUBSPOT_PORTAL_ID}
                />
              )}
              {state === 'loading' && <p className="signup-gate__loading-text">Loading sign-up form...</p>}
            </div>
          )}

          {state === 'error' && (
            <div className="signup-gate__error">
              <p className="signup-gate__error-text">
                The sign-up form could not load. Please visit{' '}
                <a
                  href="https://granular-energy.com/contact"
                  className="signup-gate__error-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  granular-energy.com/contact
                </a>{' '}
                to get in touch.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
