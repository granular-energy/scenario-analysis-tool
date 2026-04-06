import type { DateRange } from '../../types'

interface DateRangePickerProps {
  dateRange: DateRange | null
  onChange: (range: DateRange) => void
}

function toDateString(epoch: number): string {
  return new Date(epoch).toISOString().slice(0, 10)
}

function fromDateString(dateStr: string, isEnd: boolean): number {
  const d = new Date(dateStr + 'T00:00:00Z')
  // For end date, set to end of day
  if (isEnd) d.setUTCHours(23, 59, 59, 999)
  return d.getTime()
}

function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  if (!dateRange) {
    return (
      <div className="date-range-picker">
        <span className="control-card-description">
          Upload profiles to enable date range selection.
        </span>
      </div>
    )
  }

  return (
    <div className="date-range-picker">
      <div className="date-range-field">
        <label htmlFor="range-start">Start</label>
        <input
          id="range-start"
          type="date"
          value={toDateString(dateRange.start)}
          onChange={(e) =>
            onChange({ ...dateRange, start: fromDateString(e.target.value, false) })
          }
        />
      </div>
      <span className="date-range-sep">to</span>
      <div className="date-range-field">
        <label htmlFor="range-end">End</label>
        <input
          id="range-end"
          type="date"
          value={toDateString(dateRange.end)}
          onChange={(e) =>
            onChange({ ...dateRange, end: fromDateString(e.target.value, true) })
          }
        />
      </div>
    </div>
  )
}

export default DateRangePicker
