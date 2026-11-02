/** CTA band at the bottom of every tab, linking to granular-energy.com. */

export function CtaBand() {
  return (
    <div className="cta-band">
      <p className="cta-band__text">
        Want to go further? Explore how Granular Energy can help you match your consumption with clean energy,
        hour by hour.
      </p>
      <a
        href="https://granular-energy.com"
        target="_blank"
        rel="noopener noreferrer"
        className="cta-band__link"
        data-testid="cta-link"
      >
        Visit granular-energy.com
      </a>
    </div>
  )
}
