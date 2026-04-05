export interface Profile {
  id: string
  name: string
  category: 'consumption' | 'generation'
  region: string
  technology: string
  description: string
  data: number[]
}

export interface GenerationMix {
  [technology: string]: number
}

export interface TechnologyContribution {
  technology: string
  name: string
  monthlyMatched: number[]
}

export interface MatchingResult {
  cfeScore: number
  annualScore: number
  hourlyMatched: number[]
  monthlyScores: number[]
  hourlyMatchingPercentage: number[]
  technologyContributions: TechnologyContribution[]
}

export interface SavedScenario {
  id: string
  name: string
  createdAt: number
  consumptionProfileId: string
  consumptionProfileName: string
  generationMix: GenerationMix
}
