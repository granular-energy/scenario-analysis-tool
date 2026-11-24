/**
 * Load normalised profile shapes from src/data/profiles/.
 * Shapes are cached after first load so we never fetch the same JSON twice.
 */

import registryJson from '../data/profiles/registry.json'

interface ConsumptionEntry {
  id: string
  file: string
  defaultAnnualMWh: number
}

interface GenerationEntry {
  id: string
  file: string
  technology: string
  capacityFactor: number
  defaultCapacityMW: number
}

interface Registry {
  consumption: ConsumptionEntry[]
  generation: GenerationEntry[]
}

const registry = registryJson as unknown as Registry

export function getConsumptionEntries(): readonly ConsumptionEntry[] {
  return registry.consumption
}

export function getGenerationEntries(): readonly GenerationEntry[] {
  return registry.generation
}

export function getConsumptionEntry(id: string): ConsumptionEntry | undefined {
  return registry.consumption.find((e) => e.id === id)
}

export function getGenerationEntry(id: string): GenerationEntry | undefined {
  return registry.generation.find((e) => e.id === id)
}

/** Human-readable names for profile IDs. */
const DISPLAY_NAMES: Record<string, string> = {
  'data-centre': 'Data centre',
  'office-temperate': 'Office temperate',
  'office-hot-climate': 'Office hot climate',
  'factory-two-shift': 'Factory two shift',
  'residential-temperate': 'Residential temperate',
  'residential-hot-climate': 'Residential hot climate',
  'retail-shopping-centre': 'Retail shopping centre',
  'hospital-24hr': 'Hospital 24hr',
  'ev-charging-fleet': 'EV charging fleet',
  'wind-onshore-temperate': 'Wind onshore temperate',
  'wind-offshore': 'Wind offshore',
  'wind-onshore-nordic': 'Wind onshore nordic',
  'solar-pv-temperate': 'Solar PV temperate',
  'solar-pv-high-irradiance': 'Solar PV high irradiance',
  'hydro-run-of-river': 'Hydro run-of-river',
  'nuclear-baseload': 'Nuclear baseload',
}

export function displayName(id: string): string {
  return DISPLAY_NAMES[id] ?? id
}

const shapeCache = new Map<string, number[]>()

/** Lazy-import all profile JSON files so Vite code-splits them out of the main chunk. */
const profileModules = import.meta.glob<{ data: number[] }>('../data/profiles/**/*.json')

function resolveModulePath(file: string): string {
  return `../data/profiles/${file}`
}

/** Load a normalised shape (sum ~= 1.0) asynchronously from a lazy-loaded JSON chunk. */
export async function loadShape(file: string): Promise<number[]> {
  const cached = shapeCache.get(file)
  if (cached) return cached

  const modulePath = resolveModulePath(file)
  const entry = Object.entries(profileModules).find(([key]) => key.endsWith(modulePath.replace('..', '')))
  const loader = entry
    ? entry[1]
    : // Fallback: try matching just the filename part
      Object.entries(profileModules).find(([key]) => key.endsWith(file))?.[1]

  if (!loader) throw new Error(`Profile not found: ${file}`)

  const mod = await loader()
  const shape = mod.data
  shapeCache.set(file, shape)
  return shape
}
