import getTrackController from './controllers/trackController'
import config from './modules/configuration'
import { initializeDatabase, _saveStamps, _getStamps } from './modules/db'

const initializeApplication = async db => {
  console.log('Initializing')
  console.log(config)

  const saveStamps = _saveStamps(db)
  const getStamps = _getStamps(db)

  const trackController = getTrackController({
    ...config,
    saveStamps
  })

  trackController.start()
}

initializeDatabase(initializeApplication)
