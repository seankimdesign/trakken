import config from './modules/configuration'
import trackProcesses from './modules/tracker'

const initialize = async () => {
  console.log('Initializing')
  console.log(config)
  const results = await trackProcesses(config.processList)
  console.log(results)
}

initialize()
