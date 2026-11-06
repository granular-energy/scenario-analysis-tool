import { useState } from 'react'
import { AllocationTab } from './components/allocation/AllocationTab'
import { CtaBand } from './components/layout/CtaBand'
import { Header } from './components/layout/Header'
import { ScoreStrip } from './components/layout/ScoreStrip'
import { TabBar, type TabId } from './components/layout/TabBar'
import { PortfolioTab } from './components/portfolio/PortfolioTab'
import { ResultsTab } from './components/results/ResultsTab'
import { PortfolioProvider } from './state/PortfolioContext'
import './styles/app.css'

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'portfolio':
      return <PortfolioTab />
    case 'allocation':
      return <AllocationTab />
    case 'results':
      return <ResultsTab />
    case 'compare':
      return (
        <div className="placeholder-tab" data-testid="compare-placeholder">
          <p>Compare view coming soon.</p>
        </div>
      )
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('portfolio')

  return (
    <PortfolioProvider>
      <div className="app-shell">
        <Header />
        <TabBar active={activeTab} onChange={setActiveTab} />
        <ScoreStrip showScores={activeTab === 'results'} />
        <main className="app-main">
          <TabContent tab={activeTab} />
        </main>
        <CtaBand />
      </div>
    </PortfolioProvider>
  )
}
