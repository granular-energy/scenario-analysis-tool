import type { PortfolioState } from '../../types'

type Tab = PortfolioState['activeTab']

const TABS: { id: Tab; label: string }[] = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'results', label: 'Results' },
]

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="header-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`header-tab${activeTab === tab.id ? ' header-tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default TabBar
