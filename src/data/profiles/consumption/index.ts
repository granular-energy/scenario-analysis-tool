import type { Profile } from '../../../types'
import ukDataCentre from './uk-data-centre.json'
import ukOffice from './uk-office.json'
import ukFactory from './uk-factory.json'

export const consumptionProfiles: Profile[] = [
  ukDataCentre as Profile,
  ukOffice as Profile,
  ukFactory as Profile,
]
