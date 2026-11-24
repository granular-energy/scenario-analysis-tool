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
 * Shows either the HubSpot embedded form or a development-mode bypass.
 * Remembers dismissal in localStorage so returning visitors skip it.
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
    if (!isHubSpotConfigured()) return 'dev'
    return 'loading'
  })

  const modalRef = useRef<HTMLDivElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load HubSpot form when in loading state
  useEffect(() => {
    if (state !== 'loading') return

    const script = document.createElement('script')
    script.src = HUBSPOT_EMBED_URL
    script.async = true

    // 5-second timeout for script load failure
    timeoutRef.current = setTimeout(() => {
      setState('error')
    }, 5000)

    script.onload = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      try {
        // eslint-disable-next-line -- HubSpot global
        const hbspt = (window as unknown as Record<string, unknown>)['hbspt'] as {
          forms: {
            create: (opts: Record<string, unknown>) => void
          }
        }
        if (hbspt?.forms?.create && formContainerRef.current) {
          hbspt.forms.create({
            region: HUBSPOT_REGION,
            portalId: HUBSPOT_PORTAL_ID,
            formId: HUBSPOT_FORM_ID,
            target: formContainerRef.current,
            onFormSubmitted: () => {
              markSignedUp()
              setState('dismissed')
            },
          })
          setState('form')
        } else {
          setState('error')
        }
      } catch {
        setState('error')
      }
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
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

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
          <h2 className="signup-gate__title">Scenario Analysis Tool</h2>
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

          {state === 'loading' && (
            <div className="signup-gate__loading">
              <div ref={formContainerRef} />
              <p className="signup-gate__loading-text">Loading sign-up form...</p>
            </div>
          )}

          {state === 'form' && (
            <div className="signup-gate__form">
              <div ref={formContainerRef} />
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
