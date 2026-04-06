import { useCallback } from 'react'
import { PortfolioProvider } from './context/PortfolioContext'
import { usePortfolio } from './context/usePortfolio'
import Header from './components/Layout/Header'
import CallToAction from './components/Layout/CallToAction'
import PortfolioTab from './components/Portfolio/PortfolioTab'
import AllocationsTab from './components/Allocations/AllocationsTab'
import ResultsTab from './components/Results/ResultsTab'
import './App.css'

function AppContent() {
  const { state, dispatch } = usePortfolio()

  const handleTabChange = useCallback(
    (tab: 'portfolio' | 'allocations' | 'results') => {
      dispatch({ type: 'SET_ACTIVE_TAB', tab })
    },
    [dispatch]
  )

  return (
    <div className="app">
      <Header activeTab={state.activeTab} onTabChange={handleTabChange} />
      <main className="main">
        {state.activeTab === 'portfolio' && <PortfolioTab />}
        {state.activeTab === 'allocations' && <AllocationsTab />}
        {state.activeTab === 'results' && <ResultsTab />}
        <CallToAction />
      </main>
    </div>
  )
}

function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  )
}

export default App
