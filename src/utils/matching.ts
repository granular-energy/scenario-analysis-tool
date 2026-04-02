import type { Profile, GenerationMix, MatchingResult, TechnologyContribution } from '../types'

const HOURS_PER_YEAR = 8760

export const MONTH_HOURS: readonly { start: number; end: number }[] = [
  { start: 0, end: 744 },       // Jan (31 days)
  { start: 744, end: 1416 },    // Feb (28 days)
  { start: 1416, end: 2160 },   // Mar (31 days)
  { start: 2160, end: 2880 },   // Apr (30 days)
  { start: 2880, end: 3624 },   // May (31 days)
  { start: 3624, end: 4344 },   // Jun (30 days)
  { start: 4344, end: 5088 },   // Jul (31 days)
  { start: 5088, end: 5832 },   // Aug (31 days)
  { start: 5832, end: 6552 },   // Sep (30 days)
  { start: 6552, end: 7296 },   // Oct (31 days)
  { start: 7296, end: 8016 },   // Nov (30 days)
  { start: 8016, end: 8760 },   // Dec (31 days)
]

export function scaleProfile(
  profile: Profile,
  percentage: number,
  totalAnnualConsumption: number
): number[] {
  const factor = (percentage / 100) * totalAnnualConsumption
  return profile.data.map((value) => value * factor)
}

export function calculateHourlyMatching(
  consumptionProfile: Profile,
  generationMix: GenerationMix,
  generationProfiles: Profile[]
): MatchingResult {
  const totalAnnualConsumption = consumptionProfile.data.reduce((a, b) => a + b, 0)

  const totalGeneration = new Array<number>(HOURS_PER_YEAR).fill(0)
  const scaledByTech: { technology: string; name: string; scaled: number[] }[] = []

  for (const genProfile of generationProfiles) {
    const percentage = generationMix[genProfile.technology] ?? 0
    if (percentage === 0) continue

    const scaled = scaleProfile(genProfile, percentage, totalAnnualConsumption)
    scaledByTech.push({ technology: genProfile.technology, name: genProfile.name, scaled })
    for (let h = 0; h < HOURS_PER_YEAR; h++) {
      totalGeneration[h] += scaled[h]
    }
  }

  const hourlyMatched = new Array<number>(HOURS_PER_YEAR)
  const hourlyMatchingPercentage = new Array<number>(HOURS_PER_YEAR)
  for (let h = 0; h < HOURS_PER_YEAR; h++) {
    hourlyMatched[h] = Math.min(totalGeneration[h], consumptionProfile.data[h])
    hourlyMatchingPercentage[h] = consumptionProfile.data[h] > 0
      ? (hourlyMatched[h] / consumptionProfile.data[h]) * 100
      : 0
  }

  const totalMatched = hourlyMatched.reduce((a, b) => a + b, 0)
  const totalConsumption = consumptionProfile.data.reduce((a, b) => a + b, 0)
  const totalGen = totalGeneration.reduce((a, b) => a + b, 0)
  const cfeScore = totalConsumption > 0 ? (totalMatched / totalConsumption) * 100 : 0
  // Annual matching: total generation / total consumption, capped at 100%
  const annualScore = totalConsumption > 0 ? Math.min(100, (totalGen / totalConsumption) * 100) : 0

  const monthlyScores = MONTH_HOURS.map(({ start, end }) => {
    let monthConsumption = 0
    let monthMatched = 0
    for (let h = start; h < end; h++) {
      monthConsumption += consumptionProfile.data[h]
      monthMatched += hourlyMatched[h]
    }
    return monthConsumption > 0 ? (monthMatched / monthConsumption) * 100 : 0
  })

  const technologyContributions: TechnologyContribution[] = scaledByTech.map(
    ({ technology, name, scaled }) => {
      const monthlyMatched = MONTH_HOURS.map(({ start, end }) => {
        let techMatched = 0
        for (let h = start; h < end; h++) {
          const totalGen = totalGeneration[h]
          if (totalGen > 0) {
            const techShare = scaled[h] / totalGen
            techMatched += hourlyMatched[h] * techShare
          }
        }
        return techMatched
      })
      return { technology, name, monthlyMatched }
    }
  )

  return { cfeScore, annualScore, hourlyMatched, monthlyScores, hourlyMatchingPercentage, technologyContributions }
}
