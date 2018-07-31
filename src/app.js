import config from './modules/configuration'
// import trackProcesses from './modules/tracker'
import { initializeDatabase, _saveStamp, _getStamps } from './modules/db'

const initializeApplication = async db => {
  console.log('Initializing')
  console.log(config)
  // const results = await trackProcesses(config.processList)

  const saveStamp = _saveStamp(db)
  const getStamps = _getStamps(db)

  await saveStamp('100101')

  const results = await getStamps()
  console.log(results)
}

initializeDatabase(initializeApplication)
