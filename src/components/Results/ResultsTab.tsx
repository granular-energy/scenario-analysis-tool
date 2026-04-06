import { useMemo, useCallback } from 'react'
import { usePortfolio } from '../../context/usePortfolio'
import ConsumerSelector from './ConsumerSelector'
import ScoreCards from './ScoreCards'
import DateRangePicker from '../Allocations/DateRangePicker'
import HourlyHeatmap from '../Charts/HourlyHeatmap'
import MonthlyBreakdownChart from '../Charts/MonthlyBreakdownChart'
import GeneratorContributionChart from '../Charts/GeneratorContributionChart'
import { calculateConsumerMatching } from '../../utils/matching-v2'
import { filterToRange, toHourly } from '../../utils/timeseries'
import type { DateRange } from '../../types'

function ResultsTab() {
  const { state, dispatch } = usePortfolio()

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
    if (!selectedConsumer || !state.dateRange) return null
    return calculateConsumerMatching(
      selectedConsumer,
      state.generators,
      state.allocationMatrix,
      state.dateRange
    )
  }, [selectedConsumer, state.generators, state.allocationMatrix, state.dateRange])

  // Get hourly timestamps for heatmap (aligned to consumer's filtered range)
  const heatmapTimestamps = useMemo(() => {
    if (!selectedConsumer || !state.dateRange) return []
    return toHourly(filterToRange(selectedConsumer.timeSeries, state.dateRange)).timestamps
  }, [selectedConsumer, state.dateRange])

  // Monthly consumption for the generator contribution chart
  const monthlyConsumptionMWh = useMemo(() => {
    if (!result) return new Array<number>(12).fill(0)
    const monthly = new Array<number>(12).fill(0)
    for (let i = 0; i < heatmapTimestamps.length; i++) {
      const month = new Date(heatmapTimestamps[i]).getUTCMonth()
      monthly[month] += result.hourlyConsumptionMWh[i] ?? 0
    }
    return monthly
  }, [result, heatmapTimestamps])

  const hasData = state.consumers.length > 0 && state.generators.length > 0 && state.dateRange

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
            Add consumption and generation profiles on the Portfolio tab,
            then set allocations to see results.
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
      </div>

      {result && (
        <>
          <ScoreCards cfeScore={result.cfeScore} annualScore={result.annualScore} />

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
        </>
      )}
    </div>
  )
}

export default ResultsTab
