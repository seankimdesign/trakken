import config from '../../config'

const defaults = {
  trackingInterval: 60000,
  trackingTimeout: 15000,
  ignoreDurationShorterThan: 180000
}

let custom = {}
if (typeof config.trackingIntervalSec === 'number') custom.trackingInterval = config.trackingIntervalSec * 1000
if (typeof config.trackingTimeoutSec === 'number') custom.trackingTimeout = config.trackingTimeoutSec * 1000
if (typeof config.ignoreDurationShorterThanSec === 'number') custom.ignoreDurationShorterThan = config.trackingTimeoutSec * 1000

let processList = []
let processGroupList = []
if (Array.isArray(config.trackProcesses) && config.trackProcesses.length > 0) {
  processList = config.trackProcesses.filter(p => p.hasOwnProperty('name')).map(p => p.name)
  processGroupList = config.trackProcesses
    .filter(p => p.hasOwnProperty('group') && p.hasOwnProperty('name'))
    .reduce((p, n) => {
      p[n.group] = p[n.group] ? [...p[n.group], n.name] : [n.name]
      return p
    }, {})
}

export default {
  ...defaults,
  ...custom,
  processList,
  processGroupList
}
