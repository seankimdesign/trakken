import getTrackController from './controllers/trackController'
import getCacheManager from './modules/cache'
import config from './modules/configuration'
import { initializeDatabase, _saveStamps, _getStamps } from './modules/db'

const initializeApplication = async db => {
  console.log('Initializing')

  const {
    trackingInterval,
    trackingTimeout,
    ignoreDurationShorterThan,
    processList
  } = config

  const trackingBehaviorConfig = {
    trackingInterval,
    trackingTimeout,
    ignoreDurationShorterThan
  }

  const saveStamps = _saveStamps(db)
  const getStamps = _getStamps(db)
  const records = await getStamps()

  const cacheManager = getCacheManager({
    ...trackingBehaviorConfig
  })
  cacheManager.initializeCache(records)

  const trackController = getTrackController({
    ...trackingBehaviorConfig,
    processList,
    saveStamps,
    cacheManager
  })
  trackController.start()
}

initializeDatabase(initializeApplication)
