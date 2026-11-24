import { useState } from 'react'
import { AllocationTab } from './components/allocation/AllocationTab'
import { CompareTab } from './components/compare/CompareTab'
import { CtaBand } from './components/layout/CtaBand'
import { Header } from './components/layout/Header'
import { ScoreStrip } from './components/layout/ScoreStrip'
import { SignUpGate } from './components/layout/SignUpGate'
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
      return <CompareTab />
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('portfolio')

  return (
    <PortfolioProvider>
      <SignUpGate>
        <div className="app-shell">
          <Header />
          <TabBar active={activeTab} onChange={setActiveTab} />
          <ScoreStrip showScores={activeTab === 'allocation'} />
          <main
            className="app-main"
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            <TabContent tab={activeTab} />
          </main>
          <CtaBand />
        </div>
      </SignUpGate>
    </PortfolioProvider>
  )
}
