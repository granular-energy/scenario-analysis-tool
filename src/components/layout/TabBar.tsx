/** Horizontal tab bar for the four main views. Keyboard-accessible (arrow keys, Enter/Space). */

import { useCallback, useRef } from 'react'

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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      let nextIdx: number | null = null

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextIdx = (idx + 1) % TABS.length
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        nextIdx = (idx - 1 + TABS.length) % TABS.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        nextIdx = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        nextIdx = TABS.length - 1
      }

      if (nextIdx !== null) {
        tabRefs.current[nextIdx]?.focus()
        onChange(TABS[nextIdx].id)
      }
    },
    [onChange],
  )

  return (
    <nav className="tab-bar" role="tablist" aria-label="Main navigation">
      {TABS.map((tab, idx) => (
        <button
          key={tab.id}
          ref={(el) => {
            tabRefs.current[idx] = el
          }}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={tab.id === active}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={tab.id === active ? 0 : -1}
          className={`tab-bar__tab ${tab.id === active ? 'tab-bar__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          data-tab={tab.id}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
