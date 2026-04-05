import { useCallback, useState } from 'react'
import { exportPdf } from '../../utils/pdf-export'

interface ExportPdfProps {
  hourlyScore: number
  annualScore: number
  consumptionName: string
  generationMix: Record<string, number>
  onClose: () => void
}

function ExportPdf({
  hourlyScore,
  annualScore,
  consumptionName,
  generationMix,
  onClose,
}: ExportPdfProps) {
  const [title, setTitle] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportPdf(title, hourlyScore, annualScore, consumptionName, generationMix)
      onClose()
    } finally {
      setExporting(false)
    }
  }, [title, hourlyScore, annualScore, consumptionName, generationMix, onClose])

  return (
    <div className="csv-upload-overlay" onClick={onClose}>
      <div className="csv-upload-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="csv-upload-header">
          <h3>Export PDF Summary</h3>
          <button className="csv-upload-close" onClick={onClose} type="button">&times;</button>
        </div>
        <div className="csv-upload-body">
          <div className="csv-upload-field">
            <label htmlFor="pdf-title">Report title (optional)</label>
            <input
              id="pdf-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acme Corp — Wind + Solar Scenario"
            />
          </div>
          <p className="export-preview-text">
            The PDF will include the report title, hourly and annual matching scores,
            your configuration, and all charts.
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

export default ExportPdf
