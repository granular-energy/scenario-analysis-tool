/** Horizontal tab bar for the four main views. */

export type TabId = 'portfolio' | 'allocation' | 'results' | 'compare'

const TABS: { id: TabId; label: string }[] = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'results', label: 'Results' },
  { id: 'compare', label: 'Compare' },
]

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === active}
          className={`tab-bar__tab ${tab.id === active ? 'tab-bar__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
          data-tab={tab.id}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
