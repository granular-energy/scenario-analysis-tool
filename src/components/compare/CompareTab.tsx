/**
 * CompareTab: main container for the Compare view.
 * Manages scenario selection (up to 4), import, rename, and delete.
 * Renders CompareColumns, CompareChart, AssumptionsTable, ConsumerScoreTable when 2+ selected.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  generateId,
  validateScenarioFile,
  scenarioFileToPortfolioState,
  createScenarioResultsSummary,
} from '../../io/scenarioIO'
import type { SavedScenario } from '../../io/scenarioIO'
import { runEngine } from '../../engine'
import type { Consumer, Generator } from '../../engine/types'
import type { PortfolioConsumer, PortfolioGenerator } from '../../state/portfolioTypes'
import { loadScenarios, saveScenarios, removeScenario, renameScenario } from '../../state/scenarioStore'
import { generateComparisonPdf } from '../report/pdfReport'
import type { ComparisonScenario } from '../report/pdfReport'
import { CompareColumns } from './CompareColumns'
import { CompareChart } from './CompareChart'
import { AssumptionsTable } from './AssumptionsTable'
import { ConsumerScoreTable } from './ConsumerScoreTable'

const MAX_COMPARE = 4

function scaleConsumer(c: PortfolioConsumer): Consumer {
  const total = c.shape.reduce((a, b) => a + b, 0)
  const demandMWh = total > 0 ? c.shape.map((v) => (v / total) * c.annualMWh) : c.shape.map(() => 0)
  return { id: c.uid, demandMWh }
}

function scaleGenerator(g: PortfolioGenerator): Generator {
  const total = g.shape.reduce((a, b) => a + b, 0)
  const generationMWh = total > 0 ? g.shape.map((v) => (v / total) * g.annualMWh) : g.shape.map(() => 0)
  return { id: g.uid, generationMWh }
}

export function CompareTab() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => loadScenarios())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reload scenarios from localStorage on mount and when focus returns
  useEffect(() => {
    const reload = () => setScenarios(loadScenarios())
    window.addEventListener('focus', reload)
    return () => window.removeEventListener('focus', reload)
  }, [])

  // Derive valid selected IDs — filter out any that no longer exist in the scenarios list
  const validSelectedIds = useMemo(() => {
    const ids = new Set(scenarios.map((s) => s.id))
    return selectedIds.filter((id) => ids.has(id))
  }, [scenarios, selectedIds])

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, id]
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    removeScenario(id)
    setScenarios(loadScenarios())
  }, [])

  const handleRenameStart = useCallback((id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }, [])

  const handleRenameConfirm = useCallback(() => {
    if (editingId && editingName.trim()) {
      renameScenario(editingId, editingName.trim())
      setScenarios(loadScenarios())
    }
    setEditingId(null)
    setEditingName('')
  }, [editingId, editingName])

  const handleImportClick = useCallback(() => {
    setImportError(null)
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string)
        const validation = validateScenarioFile(parsed)
        if (!validation.ok) {
          setImportError(validation.error)
          return
        }

        const portfolioState = scenarioFileToPortfolioState(validation.file)

        // Run engine to get results summary
        const consumers = portfolioState.consumers.map(scaleConsumer)
        const generators = portfolioState.generators.map(scaleGenerator)
        const hasAllocation = portfolioState.generators.some((g) => {
          const row = portfolioState.matrix[g.uid]
          return row && Object.values(row).some((v) => v > 0)
        })

        if (!hasAllocation || consumers.length === 0 || generators.length === 0) {
          setImportError('The imported scenario has no valid allocations')
          return
        }

        const engineResult = runEngine({
          consumers,
          generators,
          matrix: portfolioState.matrix,
          granularity: portfolioState.granularity,
        })

        const newScenario: SavedScenario = {
          id: generateId(),
          name: validation.file.name,
          savedAt: new Date().toISOString(),
          portfolio: portfolioState,
          results: createScenarioResultsSummary(engineResult),
        }

        const existing = loadScenarios()
        existing.push(newScenario)
        saveScenarios(existing)
        setScenarios(loadScenarios())
        setImportError(null)
      } catch {
        setImportError('Could not parse the file as valid JSON')
      }
    }
    reader.readAsText(file)

    // Reset file input so the same file can be re-imported
    e.target.value = ''
  }, [])

  const selectedScenarios = scenarios.filter((s) => validSelectedIds.includes(s.id))

  const handleDownloadPdf = useCallback(() => {
    if (selectedScenarios.length < 2) return
    const pdfScenarios: ComparisonScenario[] = selectedScenarios.map((s) => ({
      name: s.name,
      portfolio: s.portfolio,
      results: s.results,
    }))
    void generateComparisonPdf(pdfScenarios)
  }, [selectedScenarios])

  // Guidance state: fewer than 2 saved scenarios
  if (scenarios.length < 2) {
    return (
      <div className="compare-tab" data-testid="compare-tab">
        <div className="compare-guidance" data-testid="compare-guidance">
          <p className="compare-guidance__text">
            Save at least 2 scenarios from the Results tab to compare them here.
          </p>
          <button
            className="btn-secondary compare-import-btn"
            data-testid="import-scenario-btn"
            onClick={handleImportClick}
          >
            Import scenario
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            aria-label="Import scenario JSON file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {importError && (
            <p className="compare-import-error" data-testid="import-error">
              {importError}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="compare-tab" data-testid="compare-tab">
      {/* Scenario picker */}
      <div className="compare-picker" data-testid="compare-picker">
        <h3 className="compare-section-title">Select scenarios to compare (up to 4)</h3>
        <div className="compare-picker__list">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="compare-picker__item">
              <label className="compare-picker__label">
                <input
                  type="checkbox"
                  checked={validSelectedIds.includes(scenario.id)}
                  disabled={!validSelectedIds.includes(scenario.id) && validSelectedIds.length >= MAX_COMPARE}
                  onChange={() => handleToggle(scenario.id)}
                  className="compare-picker__checkbox"
                />
                {editingId === scenario.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRenameConfirm}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameConfirm()
                    }}
                    className="compare-picker__rename-input"
                    autoFocus
                  />
                ) : (
                  <span className="compare-picker__name">{scenario.name}</span>
                )}
              </label>
              <div className="compare-picker__actions">
                <button
                  className="btn-secondary compare-picker__btn"
                  onClick={() => handleRenameStart(scenario.id, scenario.name)}
                  aria-label={`Rename ${scenario.name}`}
                >
                  Rename
                </button>
                <button
                  className="btn-secondary compare-picker__btn compare-picker__btn--danger"
                  onClick={() => handleDelete(scenario.id)}
                  aria-label={`Delete ${scenario.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="compare-picker__toolbar">
          <button
            className="btn-secondary compare-import-btn"
            data-testid="import-scenario-btn"
            onClick={handleImportClick}
          >
            Import scenario
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            aria-label="Import scenario JSON file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        {importError && (
          <p className="compare-import-error" data-testid="import-error">
            {importError}
          </p>
        )}
      </div>

      {/* Comparison content (requires 2+ scenarios selected) */}
      {selectedScenarios.length >= 2 && (
        <>
          <CompareColumns scenarios={selectedScenarios} />
          <CompareChart scenarios={selectedScenarios} />
          <AssumptionsTable scenarios={selectedScenarios} />
          <ConsumerScoreTable scenarios={selectedScenarios} />

          <button
            className="btn-primary compare-download-btn"
            data-testid="download-comparison-pdf"
            onClick={handleDownloadPdf}
          >
            Download comparison PDF
          </button>
        </>
      )}

      {selectedScenarios.length < 2 && (
        <p className="compare-hint">Select at least 2 scenarios above to see the comparison.</p>
      )}
    </div>
  )
}
