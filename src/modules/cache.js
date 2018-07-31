import { dateNow } from '../util'

export default () =>{

  const DEFAULT_RAW_STAMPS = {
    stamps: {},
    date: dateNow()
  }

  let cache = {}
  let rawStamps = {...DEFAULT_RAW_STAMPS}

  const buildCache = rows => {
    return {
      byDate: {},
      byName: {},
      updated: (new Date()).getTime()
    }
  }

  const updateRaw = procNames => {
    const now = (new Date()).getTime()
    if (rawStamps.date !== dateNow()) rawStamps = {...DEFAULT_RAW_STAMPS}
    procNames.map(proc => {
      rawStamps.stamps[proc] = rawStamps.stamps[proc] || []
      rawStamps.stamps[proc].push(now)
    })
  }

  const recalculateDailyCache = () => (
    Object.keys(rawStamps).map(proc => {
      const stamps = rawStamps[proc]
      const calculated = stamps.reduce(/* Reduce here */)
      return calculated
    })
  )

  return {
    initializeCache : data => {cache = buildCache(data)},
    updateCache : procNames => {updateRaw(procNames); cache = {...cache, today: recalculateDailyCache()}}
  }
}
