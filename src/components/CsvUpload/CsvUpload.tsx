import { useCallback, useRef, useState } from 'react'
import { parseCsvToProfile } from '../../utils/csv-import'
import type { Profile } from '../../types'

interface CsvUploadProps {
  category: 'consumption' | 'generation'
  onProfileUploaded: (profile: Profile) => void
  onClose: () => void
}

function CsvUpload({ category, onProfileUploaded, onClose }: CsvUploadProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setWarnings([])
    setFile(e.target.files?.[0] ?? null)
  }, [])

  const handleUpload = useCallback(() => {
    if (!file) {
      setError('Please select a CSV file.')
      return
    }
    if (!name.trim()) {
      setError('Please enter a profile name.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseCsvToProfile(text, name.trim(), category)

      if ('error' in result) {
        setError(result.error)
        return
      }

      setWarnings(result.warnings)
      onProfileUploaded(result.profile)
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsText(file)
  }, [file, name, category, onProfileUploaded])

  return (
    <div className="csv-upload-overlay" onClick={onClose}>
      <div className="csv-upload-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="csv-upload-header">
          <h3>Upload custom {category} profile</h3>
          <button className="csv-upload-close" onClick={onClose} type="button">&times;</button>
        </div>

        <div className="csv-upload-body">
          <div className="csv-upload-field">
            <label htmlFor="profile-name">Profile name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder={`e.g. My ${category === 'consumption' ? 'office' : 'wind farm'} profile`}
            />
          </div>

          <div className="csv-upload-field">
            <label htmlFor="csv-file">CSV file</label>
            <input
              id="csv-file"
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
            />
          </div>

          <div className="csv-upload-format">
            <p><strong>Accepted formats:</strong></p>
            <p>A CSV file with <strong>8,760 rows</strong> (one per hour of the year, Jan 1 00:00 to Dec 31 23:00).</p>
            <p>Either format works:</p>
            <div className="csv-format-examples">
              <div className="csv-format-example">
                <span className="csv-format-label">Single column</span>
                <pre>value{'\n'}42.5{'\n'}38.1{'\n'}41.3{'\n'}...</pre>
              </div>
              <div className="csv-format-example">
                <span className="csv-format-label">Timestamp + value</span>
                <pre>datetime,value{'\n'}2024-01-01 00:00,42.5{'\n'}2024-01-01 01:00,38.1{'\n'}2024-01-01 02:00,41.3{'\n'}...</pre>
              </div>
            </div>
            <p>Values can be in any unit (kWh, MWh, etc.) — they will be normalised automatically. Header row is optional. Leap year files (8,784 rows) are accepted and trimmed.</p>
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
          <button className="csv-upload-submit" onClick={handleUpload} type="button">Upload</button>
        </div>
      </div>
    </div>
  )
}

export default CsvUpload
