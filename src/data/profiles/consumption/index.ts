import type { Profile } from '../../../types'
import dataCentre from './data-centre.json'
import officeTemperate from './office-temperate.json'
import officeHotClimate from './office-hot-climate.json'
import factoryTwoShift from './factory-two-shift.json'
import residentialTemperate from './residential-temperate.json'
import residentialHotClimate from './residential-hot-climate.json'
import retailShoppingCentre from './retail-shopping-centre.json'
import hospital24hr from './hospital-24hr.json'
import evChargingFleet from './ev-charging-fleet.json'

export const consumptionProfiles: Profile[] = [
  dataCentre as Profile,
  officeTemperate as Profile,
  officeHotClimate as Profile,
  factoryTwoShift as Profile,
  residentialTemperate as Profile,
  residentialHotClimate as Profile,
  retailShoppingCentre as Profile,
  hospital24hr as Profile,
  evChargingFleet as Profile,
]
