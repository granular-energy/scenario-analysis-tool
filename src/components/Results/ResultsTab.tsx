import { useMemo, useCallback, useState } from 'react'
import { usePortfolio } from '../../context/usePortfolio'
import ConsumerSelector from './ConsumerSelector'
import ScoreCards from './ScoreCards'
import DateRangePicker from '../Allocations/DateRangePicker'
import HourlyHeatmap from '../Charts/HourlyHeatmap'
import MonthlyBreakdownChart from '../Charts/MonthlyBreakdownChart'
import GeneratorContributionChart from '../Charts/GeneratorContributionChart'
import { calculateConsumerMatching } from '../../utils/matching-v2'
import { filterToRange, toHourly } from '../../utils/timeseries'
import { exportResultsPdf } from '../../utils/pdf-export'
import type { DateRange } from '../../types'

function ResultsTab() {
  const { state, dispatch } = usePortfolio()
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportTitle, setExportTitle] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleConsumerSelect = useCallback(
    (id: string) => dispatch({ type: 'SELECT_CONSUMER', consumerId: id }),
    [dispatch]
  )

  const handleDateRangeChange = useCallback(
    (range: DateRange) => dispatch({ type: 'SET_DATE_RANGE', range }),
    [dispatch]
  )

  const selectedConsumer = useMemo(
    () => state.consumers.find((c) => c.id === state.selectedConsumerId) ?? null,
    [state.consumers, state.selectedConsumerId]
  )

  const result = useMemo(() => {
    if (!selectedConsumer || !state.dateRange || !state.isAllocated) return null
    return calculateConsumerMatching(
      selectedConsumer,
      state.generators,
      state.allocationMatrix,
      state.dateRange
    )
  }, [selectedConsumer, state.generators, state.allocationMatrix, state.dateRange, state.isAllocated])

  const heatmapTimestamps = useMemo(() => {
    if (!selectedConsumer || !state.dateRange) return []
    return toHourly(filterToRange(selectedConsumer.timeSeries, state.dateRange)).timestamps
  }, [selectedConsumer, state.dateRange])

  const monthlyConsumptionMWh = useMemo(() => {
    if (!result) return new Array<number>(12).fill(0)
    const monthly = new Array<number>(12).fill(0)
    for (let i = 0; i < heatmapTimestamps.length; i++) {
      const month = new Date(heatmapTimestamps[i]).getUTCMonth()
      monthly[month] += result.hourlyConsumptionMWh[i] ?? 0
    }
    return monthly
  }, [result, heatmapTimestamps])

  const handleExportPdf = useCallback(async () => {
    if (!result || !selectedConsumer) return
    setExporting(true)
    try {
      await exportResultsPdf(
        exportTitle,
        selectedConsumer.name,
        result.cfeScore,
        result.annualScore,
        '.results-charts'
      )
      setShowExportDialog(false)
      setExportTitle('')
    } finally {
      setExporting(false)
    }
  }, [result, selectedConsumer, exportTitle])

  const hasData = state.consumers.length > 0 && state.generators.length > 0 && state.dateRange && state.isAllocated

  if (!hasData) {
    return (
      <div className="results-tab">
        <div className="intro">
          <h2 className="intro-title">Results</h2>
          <p className="intro-description">
            View matching results for each consumer in your portfolio.
          </p>
        </div>
        <div className="results-empty">
          <p>
            Add profiles on the Portfolio tab, set allocations, and press
            Allocate on the Allocations tab to see results.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="results-tab">
      <div className="intro">
        <h2 className="intro-title">Results</h2>
        <p className="intro-description">
          View hourly matching results for each consumer in your portfolio.
        </p>
      </div>

      <div className="results-controls">
        <ConsumerSelector
          consumers={state.consumers}
          selectedId={state.selectedConsumerId}
          onSelect={handleConsumerSelect}
        />
        <DateRangePicker
          dateRange={state.dateRange}
          onChange={handleDateRangeChange}
        />
        <div className="results-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowExportDialog(true)}
            type="button"
            disabled={!result}
          >
            Export PDF
          </button>
        </div>
      </div>

      {result && (
        <>
          <ScoreCards cfeScore={result.cfeScore} annualScore={result.annualScore} />

          <div className="results-charts">
            <div className="charts-row">
              <div className="chart-block chart-half">
                <p className="chart-description">
                  Monthly CFE matching score for the selected consumer.
                </p>
                <MonthlyBreakdownChart monthlyScores={result.monthlyScores} />
              </div>
              <div className="chart-block chart-half">
                <p className="chart-description">
                  Which generators contribute most to the consumer's hourly matching.
                </p>
                <GeneratorContributionChart
                  contributions={result.generatorContributions}
                  monthlyConsumptionMWh={monthlyConsumptionMWh}
                />
              </div>
            </div>

            <div className="chart-block">
              <p className="chart-description">
                Every hour by matching percentage. Green = fully matched,
                red = significant gap between allocated generation and consumption.
              </p>
              <HourlyHeatmap
                timestamps={heatmapTimestamps}
                hourlyMatchingPercentage={result.hourlyMatchingPercentage}
              />
            </div>
          </div>
        </>
      )}

      {showExportDialog && (
        <div className="csv-upload-overlay" onClick={() => setShowExportDialog(false)}>
          <div className="csv-upload-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="csv-upload-header">
              <h3>Export PDF Report</h3>
              <button className="csv-upload-close" onClick={() => setShowExportDialog(false)} type="button">&times;</button>
            </div>
            <div className="csv-upload-body">
              <div className="csv-upload-field">
                <label htmlFor="pdf-title">Report title (optional)</label>
                <input
                  id="pdf-title"
                  type="text"
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  placeholder="e.g. Q1 2025 Analysis"
                />
              </div>
              <p className="export-preview-text">
                The PDF will include scores, charts, and configuration for{' '}
                <strong>{selectedConsumer?.name}</strong>.
              </p>
            </div>
            <div className="csv-upload-footer">
              <button className="csv-upload-cancel" onClick={() => setShowExportDialog(false)} type="button">Cancel</button>
              <button
                className="csv-upload-submit"
                onClick={handleExportPdf}
                type="button"
                disabled={exporting}
              >
                {exporting ? 'Generating...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsTab
