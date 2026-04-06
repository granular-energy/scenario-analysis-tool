import TabBar from '../Tabs/TabBar'
import type { PortfolioState } from '../../types'

interface HeaderProps {
  activeTab: PortfolioState['activeTab']
  onTabChange: (tab: PortfolioState['activeTab']) => void
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
        <TabBar activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  )
}

export default Header
