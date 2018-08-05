import { log, dump } from '../util'
import trackProcesses from '../modules/tracker'

const STAGES = {
  HOLD: 'HOLD',
  AWAIT_TRACK: 'AWAIT_TRACK',
  AWAIT_DB: 'AWAIT_DB'
}

export default ({
  trackingInterval,
  trackingTimeout,
  ignoreDurationShorterThan,
  processList,
  saveStamps,
  cacheManager
}) => {
  let timer

  const DEFAULT_CONTROLLER_STATE = {
    active: false,
    stage: STAGES.HOLD,
    loopStartedOn: 0,
    pauseRequested: false
  }

  let controllerState = {...DEFAULT_CONTROLLER_STATE}

  const startLoop = () => {
    log('Tracking loop began')
    if (controllerState.pauseRequested) {
      log('Tracking Controller paused on request. Dumping current state')
      dump(controllerState)
      controllerState.active = false
    } else {
      controllerState = {
        active: true,
        stage: STAGES.HOLD,
        loopStartedOn: (new Date()).getTime(),
        pauseRequested: false
      }
      timer = setTimeout(trackingLoop, trackingInterval)
    }
  }

  const validateTrackedResults = res => res.length > 0

  const trackingLoop = async () => {
    controllerState.stage = STAGES.AWAIT_TRACK
    const trackedResults = await trackProcesses(processList)
    if (!controllerState.active) return terminateLoop('force terminate call')
    if (validateTrackedResults(trackedResults)) {
      const extractedProcNames = trackedResults.map(v => v.imageName)
      const cacheUpdated = cacheManager.updateCache(extractedProcNames)
      if (cacheUpdated === true) {
        controllerState.stage = STAGES.AWAIT_DB
        const writeSuccess = await saveStamps(extractedProcNames)
        if (!writeSuccess) return terminateLoop('error writing to database')
        if (!controllerState.active) return terminateLoop('force terminate call')
      } else {
        log('error', cacheUpdated)
      }
    }
    return startLoop()
  }

  const terminateLoop = msg => {
    controllerState = {...DEFAULT_CONTROLLER_STATE}
    clearTimeout(timer)
    log('error', `Tracking Loop [${controllerState.loopStartedOn}] terminicated due to: ${msg}`)
  }

  return {
    start: () => {
      if (controllerState.active) {
        log('error', 'Tracking Controller is already active and could not be started')
      } else {
        log('Tracking Controller started successfully')
        startLoop()
      }
    },
    requestPause: () => { controllerState.pauseRequested = true },
    forceStop: () => { controllerState.active = false }
  }
}
