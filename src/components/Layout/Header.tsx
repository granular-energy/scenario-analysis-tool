interface HeaderProps {
  activeTab: 'builder' | 'compare'
  onTabChange: (tab: 'builder' | 'compare') => void
}

function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-accent" />
      <div className="header-inner">
        <img
          className="header-logo"
          src="/granular-logo-dark.svg"
          alt="Granular Energy"
          height="24"
        />
        <nav className="header-nav">
          <button
            className={`header-tab${activeTab === 'builder' ? ' header-tab--active' : ''}`}
            onClick={() => onTabChange('builder')}
            type="button"
          >
            Builder
          </button>
          <button
            className={`header-tab${activeTab === 'compare' ? ' header-tab--active' : ''}`}
            onClick={() => onTabChange('compare')}
            type="button"
          >
            Compare
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
