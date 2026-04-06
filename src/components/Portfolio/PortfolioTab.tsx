import { useState, useCallback } from 'react'
import { usePortfolio } from '../../context/usePortfolio'
import ProfileCard from './ProfileCard'
import CsvUploadDialog from './CsvUploadDialog'
import { exampleConsumers, exampleGenerators } from '../../data/examples'
import type { PortfolioProfile } from '../../types'

const MAX_PROFILES = 5

function PortfolioTab() {
  const { state, dispatch } = usePortfolio()
  const [uploadRole, setUploadRole] = useState<'consumer' | 'generator' | null>(null)

  const handleUpload = useCallback(
    (profile: PortfolioProfile) => {
      dispatch({ type: 'ADD_PROFILE', profile })
      setUploadRole(null)
    },
    [dispatch]
  )

  const handleRemove = useCallback(
    (id: string, role: 'consumer' | 'generator') => {
      dispatch({ type: 'REMOVE_PROFILE', id, role })
    },
    [dispatch]
  )

  const handleLoadExamples = useCallback(() => {
    const existingIds = new Set([
      ...state.consumers.map((c) => c.id),
      ...state.generators.map((g) => g.id),
    ])
    for (const p of exampleConsumers) {
      if (!existingIds.has(p.id) && state.consumers.length < MAX_PROFILES) {
        dispatch({ type: 'ADD_PROFILE', profile: p })
      }
    }
    for (const p of exampleGenerators) {
      if (!existingIds.has(p.id) && state.generators.length < MAX_PROFILES) {
        dispatch({ type: 'ADD_PROFILE', profile: p })
      }
    }
  }, [state.consumers, state.generators, dispatch])

  const hasExamples = state.consumers.some((c) => c.id.startsWith('example-')) ||
    state.generators.some((g) => g.id.startsWith('example-'))

  return (
    <div className="portfolio-tab">
      <div className="intro">
        <h2 className="intro-title">Portfolio Definition</h2>
        <p className="intro-description">
          Upload consumption and generation profiles to build your portfolio.
          Each profile is a two-column CSV with timestamps and MWh values.
        </p>
      </div>

      {state.consumers.length === 0 && state.generators.length === 0 && (
        <div className="example-banner">
          <p>New here? Load example profiles to try the tool.</p>
          <button className="btn-primary" onClick={handleLoadExamples} type="button">
            Load Example Profiles
          </button>
        </div>
      )}

      <div className="controls-row">
        <section className="control-card">
          <h3 className="control-card-title">Consumption Profiles</h3>
          <p className="control-card-description">
            Upload up to {MAX_PROFILES} consumption profiles representing your demand.
          </p>

          {state.consumers.length > 0 && (
            <div className="profile-card-list">
              {state.consumers.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  onRemove={() => handleRemove(p.id, 'consumer')}
                />
              ))}
            </div>
          )}

          {state.consumers.length === 0 && (
            <p className="mix-empty">No consumption profiles uploaded yet.</p>
          )}

          <div className="control-card-actions">
            {state.consumers.length < MAX_PROFILES && (
              <button
                className="btn-primary"
                onClick={() => setUploadRole('consumer')}
                type="button"
              >
                + Add Consumption Profile
              </button>
            )}
          </div>
        </section>

        <section className="control-card">
          <h3 className="control-card-title">Generation Profiles</h3>
          <p className="control-card-description">
            Upload up to {MAX_PROFILES} generation profiles representing your supply.
          </p>

          {state.generators.length > 0 && (
            <div className="profile-card-list">
              {state.generators.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  onRemove={() => handleRemove(p.id, 'generator')}
                />
              ))}
            </div>
          )}

          {state.generators.length === 0 && (
            <p className="mix-empty">No generation profiles uploaded yet.</p>
          )}

          <div className="control-card-actions">
            {state.generators.length < MAX_PROFILES && (
              <button
                className="btn-primary"
                onClick={() => setUploadRole('generator')}
                type="button"
              >
                + Add Generation Profile
              </button>
            )}
            {!hasExamples && state.generators.length < MAX_PROFILES && (
              <button
                className="btn-secondary"
                onClick={handleLoadExamples}
                type="button"
              >
                Load Examples
              </button>
            )}
          </div>
        </section>
      </div>

      {uploadRole && (
        <CsvUploadDialog
          role={uploadRole}
          onProfileUploaded={handleUpload}
          onClose={() => setUploadRole(null)}
        />
      )}
    </div>
  )
}

export default PortfolioTab
