import type { Profile } from '../../../types'
import windOnshoreTemperate from './wind-onshore-temperate.json'
import windOffshore from './wind-offshore.json'
import windOnshoreNordic from './wind-onshore-nordic.json'
import solarPvTemperate from './solar-pv-temperate.json'
import solarPvHighIrradiance from './solar-pv-high-irradiance.json'
import nuclearBaseload from './nuclear-baseload.json'
import hydroRunOfRiver from './hydro-run-of-river.json'

export const generationProfiles: Profile[] = [
  windOnshoreTemperate as Profile,
  windOffshore as Profile,
  windOnshoreNordic as Profile,
  solarPvTemperate as Profile,
  solarPvHighIrradiance as Profile,
  hydroRunOfRiver as Profile,
  nuclearBaseload as Profile,
]
