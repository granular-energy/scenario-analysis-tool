/** CSV upload modal with timezone selector, unit selector, preview chart, and confirmation. */

import { useCallback, useRef, useState } from 'react'
import type { EnergyUnit, UploadResult } from '../../io/profileUpload'
import { parseProfileCsv } from '../../io/profileUpload'
import { isValidTimeZone } from '../../io/timestamps'
import { Sparkline } from './Sparkline'

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Stockholm',
  'Europe/Helsinki',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Athens',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

const UNITS: EnergyUnit[] = ['MWh', 'kWh', 'MW', 'kW']

interface CsvUploadModalProps {
  profileType: 'consumer' | 'generator'
  onConfirm: (hourlyMWh: number[], name: string) => void
  onClose: () => void
}

export function CsvUploadModal({ profileType, onConfirm, onClose }: CsvUploadModalProps) {
  const [timeZone, setTimeZone] = useState('UTC')
  const [unit, setUnit] = useState<EnergyUnit>('MWh')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      setResult(null)
      setFileName(file.name)

      if (!isValidTimeZone(timeZone)) {
        setError(`"${timeZone}" is not a recognised timezone. Use an IANA name like Europe/London.`)
        return
      }

      try {
        const text = await file.text()
        const parsed = parseProfileCsv(text, { timeZone, unit })
        setResult(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV')
      }
    },
    [timeZone, unit],
  )

  const handleConfirm = useCallback(() => {
    if (!result) return
    const name = fileName.replace(/\.csv$/i, '') || `Uploaded ${profileType}`
    onConfirm(result.hourlyMWh, name)
    onClose()
  }, [result, fileName, profileType, onConfirm, onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Upload ${profileType} CSV`}
      >
        <div className="modal-card__header">
          <h3>Upload {profileType} CSV</h3>
          <button className="modal-card__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="csv-upload__controls">
          <label className="csv-upload__field">
            <span className="csv-upload__field-label">Timezone</span>
            <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} data-testid="tz-select">
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>

          <label className="csv-upload__field">
            <span className="csv-upload__field-label">Unit</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as EnergyUnit)}
              data-testid="unit-select"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="csv-upload__dropzone">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            aria-label={`Choose ${profileType} CSV file`}
            data-testid="csv-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {error && (
          <div className="csv-upload__error" data-testid="upload-error">
            {error}
          </div>
        )}

        {result && (
          <div className="csv-upload__preview" data-testid="upload-preview">
            <p className="csv-upload__info">
              {result.rowsUsed.toLocaleString()} rows parsed ({result.resolution}).
              {result.notices.map((n, i) => (
                <span key={i} className="csv-upload__notice">
                  {' '}
                  {n.message}
                </span>
              ))}
            </p>
            <Sparkline shape={result.hourlyMWh} width={280} height={48} />
            <button
              className="btn-primary csv-upload__confirm"
              onClick={handleConfirm}
              data-testid="confirm-upload"
            >
              Add to portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
