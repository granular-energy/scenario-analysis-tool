import { useCallback, useState, useMemo } from 'react'
import type { SavedScenario, Profile } from '../../types'
import { calculateHourlyMatching } from '../../utils/matching'
import { exportComparisonPdf } from '../../utils/pdf-export'

interface ComparisonExportPdfProps {
  savedScenarios: SavedScenario[]
  selectedIds: string[]
  allConsumption: Profile[]
  allGeneration: Profile[]
  onClose: () => void
}

function ComparisonExportPdf({
  savedScenarios,
  selectedIds,
  allConsumption,
  allGeneration,
  onClose,
}: ComparisonExportPdfProps) {
  const [title, setTitle] = useState('')
  const [exporting, setExporting] = useState(false)

  const comparisonScenarios = useMemo(() => {
    return selectedIds
      .map((id) => {
        const scenario = savedScenarios.find((s) => s.id === id)
        if (!scenario) return null
        const profile = allConsumption.find((p) => p.id === scenario.consumptionProfileId)
        if (!profile) return null
        const result = calculateHourlyMatching(profile, scenario.generationMix, allGeneration)
        return {
          name: scenario.name,
          hourlyScore: result.cfeScore,
          annualScore: result.annualScore,
          consumptionName: scenario.consumptionProfileName,
          generationMix: scenario.generationMix,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [selectedIds, savedScenarios, allConsumption, allGeneration])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportComparisonPdf(title, comparisonScenarios)
      onClose()
    } finally {
      setExporting(false)
    }
  }, [title, comparisonScenarios, onClose])

  return (
    <div className="csv-upload-overlay" onClick={onClose}>
      <div className="csv-upload-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="csv-upload-header">
          <h3>Export Comparison PDF</h3>
          <button className="csv-upload-close" onClick={onClose} type="button">&times;</button>
        </div>
        <div className="csv-upload-body">
          <div className="csv-upload-field">
            <label htmlFor="compare-pdf-title">Report title (optional)</label>
            <input
              id="compare-pdf-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Procurement Options"
            />
          </div>
          <p className="export-preview-text">
            The PDF will include a side-by-side comparison of {comparisonScenarios.length} scenarios
            with scores, configurations, and charts.
          </p>
        </div>
        <div className="csv-upload-footer">
          <button className="csv-upload-cancel" onClick={onClose} type="button">Cancel</button>
          <button
            className="csv-upload-submit"
            onClick={handleExport}
            type="button"
            disabled={exporting}
          >
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComparisonExportPdf
