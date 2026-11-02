/** App header with the Granular wave logo and title. */

export function Header() {
  return (
    <header className="app-header">
      <img
        src="/brand/granular-wave.svg"
        alt="Granular Energy"
        className="app-header__logo"
        width={32}
        height={32}
      />
      <h1 className="app-header__title">Scenario Analysis Tool</h1>
    </header>
  )
}
