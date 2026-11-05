/** Portfolio tab: two panels for consumers and generators with add/upload/remove actions. */

import { useCallback, useState } from 'react'
import { usePortfolioContext } from '../../state/usePortfolioContext'
import {
  displayName,
  getConsumptionEntries,
  getConsumptionEntry,
  getGenerationEntries,
  getGenerationEntry,
  loadShape,
} from '../../state/profileLoader'
import { MAX_CONSUMERS, MAX_GENERATORS } from '../../state/portfolioTypes'
import type { PortfolioConsumer, PortfolioGenerator } from '../../state/portfolioTypes'
import { ConsumerCard } from './ConsumerCard'
import { CsvUploadModal } from './CsvUploadModal'
import { GeneratorCard } from './GeneratorCard'
import { LibraryPicker } from './LibraryPicker'

let nextId = Date.now()
function uid(): string {
  return `u-${nextId++}`
}

export function PortfolioTab() {
  const { state, dispatch } = usePortfolioContext()
  const [showConsumerPicker, setShowConsumerPicker] = useState(false)
  const [showGeneratorPicker, setShowGeneratorPicker] = useState(false)
  const [showConsumerUpload, setShowConsumerUpload] = useState(false)
  const [showGeneratorUpload, setShowGeneratorUpload] = useState(false)

  const consumerItems = getConsumptionEntries().map((e) => ({
    id: e.id,
    name: displayName(e.id),
  }))

  const generatorItems = getGenerationEntries().map((e) => ({
    id: e.id,
    name: displayName(e.id),
  }))

  const handleAddConsumer = useCallback(
    (profileId: string) => {
      const entry = getConsumptionEntry(profileId)
      if (!entry) return
      const consumer: PortfolioConsumer = {
        uid: uid(),
        profileId: entry.id,
        name: displayName(entry.id),
        annualMWh: entry.defaultAnnualMWh,
        shape: loadShape(entry.file),
        source: 'library',
      }
      dispatch({ type: 'ADD_CONSUMER', consumer })
    },
    [dispatch],
  )

  const handleAddGenerator = useCallback(
    (profileId: string) => {
      const entry = getGenerationEntry(profileId)
      if (!entry) return
      const generator: PortfolioGenerator = {
        uid: uid(),
        profileId: entry.id,
        name: displayName(entry.id),
        annualMWh: Math.round(entry.defaultCapacityMW * entry.capacityFactor * 8760),
        capacityFactor: entry.capacityFactor,
        technology: entry.technology,
        shape: loadShape(entry.file),
        source: 'library',
      }
      dispatch({ type: 'ADD_GENERATOR', generator })
    },
    [dispatch],
  )

  const handleUploadConsumer = useCallback(
    (hourlyMWh: number[], name: string) => {
      const total = hourlyMWh.reduce((a, b) => a + b, 0)
      const shape = total > 0 ? hourlyMWh.map((v) => v / total) : hourlyMWh
      const consumer: PortfolioConsumer = {
        uid: uid(),
        profileId: `upload-${name}`,
        name,
        annualMWh: Math.round(total),
        shape,
        source: 'upload',
      }
      dispatch({ type: 'ADD_CONSUMER', consumer })
    },
    [dispatch],
  )

  const handleUploadGenerator = useCallback(
    (hourlyMWh: number[], name: string) => {
      const total = hourlyMWh.reduce((a, b) => a + b, 0)
      const shape = total > 0 ? hourlyMWh.map((v) => v / total) : hourlyMWh
      // Estimate capacity factor from the data: CF = total / (peakMW × 8760) but we approximate
      const peakMWh = Math.max(...hourlyMWh)
      const peakMW = peakMWh > 0 ? peakMWh : 1
      const capacityFactor = total / (peakMW * 8760)
      const generator: PortfolioGenerator = {
        uid: uid(),
        profileId: `upload-${name}`,
        name,
        annualMWh: Math.round(total),
        capacityFactor: Math.round(capacityFactor * 100) / 100,
        technology: 'unknown',
        shape,
        source: 'upload',
      }
      dispatch({ type: 'ADD_GENERATOR', generator })
    },
    [dispatch],
  )

  const consumersAtLimit = state.consumers.length >= MAX_CONSUMERS
  const generatorsAtLimit = state.generators.length >= MAX_GENERATORS

  return (
    <div className="portfolio-tab">
      {/* Consumers panel */}
      <section className="portfolio-panel" data-testid="consumers-panel">
        <div className="portfolio-panel__header">
          <h2>Consumers</h2>
          <div className="portfolio-panel__actions">
            <button
              className="btn-secondary"
              onClick={() => setShowConsumerPicker(true)}
              disabled={consumersAtLimit}
              data-testid="add-consumer-library"
            >
              Add from library
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowConsumerUpload(true)}
              disabled={consumersAtLimit}
              data-testid="add-consumer-upload"
            >
              Upload CSV
            </button>
          </div>
        </div>
        <div className="portfolio-panel__cards">
          {state.consumers.map((c) => (
            <ConsumerCard
              key={c.uid}
              consumer={c}
              onRemove={(uid) => dispatch({ type: 'REMOVE_CONSUMER', uid })}
              onUpdateSizing={(uid, annualMWh) =>
                dispatch({ type: 'UPDATE_CONSUMER_SIZING', uid, annualMWh })
              }
            />
          ))}
          {state.consumers.length === 0 && (
            <p className="portfolio-panel__empty">
              No consumers yet. Add one from the library or upload a CSV.
            </p>
          )}
        </div>
      </section>

      {/* Generators panel */}
      <section className="portfolio-panel portfolio-panel--generators" data-testid="generators-panel">
        <div className="portfolio-panel__header">
          <h2>Generators</h2>
          <div className="portfolio-panel__actions">
            <button
              className="btn-secondary"
              onClick={() => setShowGeneratorPicker(true)}
              disabled={generatorsAtLimit}
              data-testid="add-generator-library"
            >
              Add from library
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowGeneratorUpload(true)}
              disabled={generatorsAtLimit}
              data-testid="add-generator-upload"
            >
              Upload CSV
            </button>
          </div>
        </div>
        <div className="portfolio-panel__cards">
          {state.generators.map((g) => (
            <GeneratorCard
              key={g.uid}
              generator={g}
              onRemove={(uid) => dispatch({ type: 'REMOVE_GENERATOR', uid })}
              onUpdateSizing={(uid, annualMWh) =>
                dispatch({ type: 'UPDATE_GENERATOR_SIZING', uid, annualMWh })
              }
            />
          ))}
          {state.generators.length === 0 && (
            <p className="portfolio-panel__empty">
              No generators yet. Add one from the library or upload a CSV.
            </p>
          )}
        </div>
      </section>

      {/* Modals */}
      {showConsumerPicker && (
        <LibraryPicker
          title="Add consumer from library"
          items={consumerItems}
          onSelect={handleAddConsumer}
          onClose={() => setShowConsumerPicker(false)}
        />
      )}
      {showGeneratorPicker && (
        <LibraryPicker
          title="Add generator from library"
          items={generatorItems}
          onSelect={handleAddGenerator}
          onClose={() => setShowGeneratorPicker(false)}
        />
      )}
      {showConsumerUpload && (
        <CsvUploadModal
          profileType="consumer"
          onConfirm={handleUploadConsumer}
          onClose={() => setShowConsumerUpload(false)}
        />
      )}
      {showGeneratorUpload && (
        <CsvUploadModal
          profileType="generator"
          onConfirm={handleUploadGenerator}
          onClose={() => setShowGeneratorUpload(false)}
        />
      )}
    </div>
  )
}
