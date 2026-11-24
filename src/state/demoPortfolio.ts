/**
 * Default demo portfolio loaded on first visit (no localStorage).
 * Matches the golden fixture "single-consumer-solar-wind" so the score strip
 * shows a 67.33 % hourly score and a 100.74 % annual (volumetric) score.
 */

import { displayName, getConsumptionEntry, getGenerationEntry, loadShape } from './profileLoader'
import type { PortfolioState } from './portfolioTypes'

export async function createDemoPortfolio(): Promise<PortfolioState> {
  const dcEntry = getConsumptionEntry('data-centre')!
  const solarEntry = getGenerationEntry('solar-pv-temperate')!
  const windEntry = getGenerationEntry('wind-onshore-temperate')!

  const dcUid = 'demo-dc'
  const solarUid = 'demo-solar'
  const windUid = 'demo-wind'

  const [dcShape, solarShape, windShape] = await Promise.all([
    loadShape(dcEntry.file),
    loadShape(solarEntry.file),
    loadShape(windEntry.file),
  ])

  return {
    consumers: [
      {
        uid: dcUid,
        profileId: dcEntry.id,
        name: displayName(dcEntry.id),
        annualMWh: 50_000, // matches golden fixture
        shape: dcShape,
        source: 'library',
      },
    ],
    generators: [
      {
        uid: solarUid,
        profileId: solarEntry.id,
        name: displayName(solarEntry.id),
        annualMWh: 24_090, // = 25 MW x 0.11 CF x 8760, matches golden fixture
        capacityFactor: solarEntry.capacityFactor,
        technology: solarEntry.technology,
        shape: solarShape,
        source: 'library',
      },
      {
        uid: windUid,
        profileId: windEntry.id,
        name: displayName(windEntry.id),
        annualMWh: 26_280, // = 10 MW x 0.30 CF x 8760, matches golden fixture
        capacityFactor: windEntry.capacityFactor,
        technology: windEntry.technology,
        shape: windShape,
        source: 'library',
      },
    ],
    matrix: {
      [solarUid]: { [dcUid]: 100 },
      [windUid]: { [dcUid]: 100 },
    },
    granularity: 'hourly',
  }
}
