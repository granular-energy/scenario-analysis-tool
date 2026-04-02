import type { Profile } from '../../../types'
import ukWindOnshore from './uk-wind-onshore.json'
import ukSolarPv from './uk-solar-pv.json'
import ukHydro from './uk-hydro.json'

export const generationProfiles: Profile[] = [
  ukWindOnshore as Profile,
  ukSolarPv as Profile,
  ukHydro as Profile,
]
