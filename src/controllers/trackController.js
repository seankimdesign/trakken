import { log, dump } from '../util'
import trackProcesses from '../modules/tracker'
import mapProcesses from '../modules/mapper'

const STAGES = {
  HOLD: 'HOLD',
  AWAIT_TRACK: 'AWAIT_TRACK',
  AWAIT_DB: 'AWAIT_DB',
}

export default ({
  trackingInterval,
  trackingTimeout,
  ignoreDurationShorterThan,
  processList,
  saveStamps
}) => {

  let timer

  const DEFAULT_CONTROLLER_STATE = {
    active: false,
    stage: STAGES.HOLD,
    loopStartedOn: 0,
    pauseRequested: false
  }

  const controllerState = {...DEFAULT_CONTROLLER_STATE}

  const startLoop = () => {
    if (controllerState.pauseRequested){
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
    if (validateTrackedResults(trackedResults)){
      const mappedResults = mapProcesses(trackedResults)
      controllerState.stage = STAGES.AWAIT_DB
      const writeSuccess = await saveStamps(mappedResults)
      if (!writeSuccess) return terminateLoop('error writing to database')
      if (!controllerState.active) return terminateLoop('force terminate call')
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
      if (controllerState.active){
        log('error', 'Tracking Controller is already active and could not be started')
      } else {
        startLoop()
        log('Tracking Controller started successfully')
      }
    },
    requestPause: () => controllerState.pauseRequested = true,
    forceStop: () => controllerState.active = false
  }
}
