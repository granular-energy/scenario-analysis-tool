import { useState, useCallback } from 'react'
import { parseCsvToProfile } from '../../utils/csv-import-v2'
import type { PortfolioProfile } from '../../types'

interface CsvUploadDialogProps {
  role: 'consumer' | 'generator'
  onProfileUploaded: (profile: PortfolioProfile) => void
  onClose: () => void
}

function CsvUploadDialog({ role, onProfileUploaded, onClose }: CsvUploadDialogProps) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleSubmit = useCallback(() => {
    if (!file || !name.trim()) return
    setError(null)
    setWarnings([])

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseCsvToProfile(text, name.trim(), role)
      if ('error' in result) {
        setError(result.error)
      } else {
        setWarnings(result.warnings)
        if (result.warnings.length === 0) {
          onProfileUploaded(result.profile)
        } else {
          // Show warnings but still allow upload
          onProfileUploaded(result.profile)
        }
      }
    }
    reader.readAsText(file)
  }, [file, name, role, onProfileUploaded])

  const roleLabel = role === 'consumer' ? 'Consumption' : 'Generation'

  return (
    <div className="csv-upload-overlay" onClick={onClose}>
      <div className="csv-upload-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="csv-upload-header">
          <h3>Upload {roleLabel} Profile</h3>
          <button className="csv-upload-close" onClick={onClose} type="button">&times;</button>
        </div>
        <div className="csv-upload-body">
          <div className="csv-upload-field">
            <label htmlFor="profile-name">Profile name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'consumer' ? 'e.g. London Office' : 'e.g. Wind Farm Alpha'}
            />
          </div>
          <div className="csv-upload-field">
            <label htmlFor="profile-file">CSV file</label>
            <input
              id="profile-file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="csv-upload-format">
            <p>
              Two-column CSV: <strong>timestamp</strong> and <strong>MWh value</strong>.
              Hourly or half-hourly resolution (auto-detected).
            </p>
            <div className="csv-format-examples">
              <div className="csv-format-example">
                <span className="csv-format-label">Example format</span>
                <pre>timestamp,value{'\n'}2025-01-01 00:00,1.23{'\n'}2025-01-01 01:00,1.45{'\n'}2025-01-01 02:00,0.98</pre>
              </div>
            </div>
          </div>
          {error && <p className="csv-upload-error">{error}</p>}
          {warnings.length > 0 && (
            <div className="csv-upload-warnings">
              {warnings.map((w, i) => <p key={i}>{w}</p>)}
            </div>
          )}
        </div>
        <div className="csv-upload-footer">
          <button className="csv-upload-cancel" onClick={onClose} type="button">Cancel</button>
          <button
            className="csv-upload-submit"
            onClick={handleSubmit}
            type="button"
            disabled={!file || !name.trim()}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  )
}

export default CsvUploadDialog
