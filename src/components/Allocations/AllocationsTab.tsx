import { useMemo, useCallback } from 'react'
import { usePortfolio } from '../../context/usePortfolio'
import DateRangePicker from './DateRangePicker'
import AllocationMatrix from './AllocationMatrix'
import SankeyDiagram from './SankeyDiagram'
import { computeSankeyLinks } from '../../utils/sankey'
import type { DateRange } from '../../types'

function AllocationsTab() {
  const { state, dispatch } = usePortfolio()

  const handleAllocationChange = useCallback(
    (generatorId: string, consumerId: string, percentage: number) => {
      dispatch({ type: 'SET_ALLOCATION', generatorId, consumerId, percentage })
    },
    [dispatch]
  )

  const handleDateRangeChange = useCallback(
    (range: DateRange) => {
      dispatch({ type: 'SET_DATE_RANGE', range })
    },
    [dispatch]
  )

  const handleAllocate = useCallback(() => {
    dispatch({ type: 'ALLOCATE' })
  }, [dispatch])

  const sankeyLinks = useMemo(() => {
    if (!state.dateRange || !state.isAllocated) return []
    return computeSankeyLinks(
      state.generators,
      state.consumers,
      state.allocationMatrix,
      state.dateRange
    )
  }, [state.generators, state.consumers, state.allocationMatrix, state.dateRange, state.isAllocated])

  const hasProfiles = state.consumers.length > 0 && state.generators.length > 0

  return (
    <div className="allocations-tab">
      <div className="intro">
        <h2 className="intro-title">Allocations</h2>
        <p className="intro-description">
          Define how each generator's output is allocated to each consumer.
          Percentages represent the share of total generation allocated.
        </p>
      </div>

      <div className="control-card">
        <h3 className="control-card-title">Date Range</h3>
        <DateRangePicker
          dateRange={state.dateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      <div className="control-card">
        <h3 className="control-card-title">Allocation Matrix</h3>
        <p className="control-card-description">
          Set the percentage of each generator's output to allocate to each consumer.
          Column totals should not exceed 100%.
        </p>
        <AllocationMatrix
          generators={state.generators}
          consumers={state.consumers}
          matrix={state.allocationMatrix}
          onAllocationChange={handleAllocationChange}
        />
        {hasProfiles && (
          <div className="allocate-action">
            <button
              className="btn-primary allocate-btn"
              onClick={handleAllocate}
              type="button"
            >
              Allocate
            </button>
            {!state.isAllocated && (
              <span className="allocate-hint">
                Press Allocate to calculate results and view energy flows.
              </span>
            )}
            {state.isAllocated && (
              <span className="allocate-hint allocate-hint--done">
                Allocation applied. View results in the Results tab.
              </span>
            )}
          </div>
        )}
      </div>

      {state.isAllocated && <SankeyDiagram links={sankeyLinks} />}
    </div>
  )
}

export default AllocationsTab
