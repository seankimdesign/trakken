import flow from 'lodash/flow'
import { dateString, getDayEnd, getDayStart } from '../util'

export default ({
  trackingInterval,
  trackingTimeout,
  ignoreDurationShorterThan,
  processList,
  saveStamps
}) =>{

  const MIN_SESSION_GAP = (trackingInterval * 1.5) + trackingTimeout

  const DEFAULT_CURRENT_STAMPS = {
    stamps: {},
    date: dateString()
  }

  let cache = {}
  let currentStamps = {...DEFAULT_CURRENT_STAMPS}

  const buildCache = rows => {
    const today = dateString()
    const filteredRows = rows.reduce((p,n) => {
      const designation = n.timestamp.slice(10) === today ? 'today' : 'past'
      return {...p, [designation]: [...p[designation], n]}
    }, {past:[], today:[]})
    const store = flow([buildStore, reduceStore, filterStore, fortifyStore])(filteredRows.past)
    return {
      cache:{
        byDate: buildDateCache(filteredRows.past),
        byName: buildNameCache(filteredRows.past),
        updated: (new Date()).getTime()
      },
      current: filteredRows.today
    }
  }

  const buildStore = rows => {
    const store = {}
    rows.forEach(r => {
      const proc = r.proc_name
      store[proc] = store[proc] || []
      store[proc].push(new Date(r.timestamp).getTime())
    })
    for (let key in store){
      if (store.hasOwnProperty(key)) store[key].sort()
    }
    return store
  }

  const reduceStore = store => {
    const reducedStore = {}
    Object.keys(store).forEach(p => {
      reducedStore[p] = store[p].reduce((p, n) => {
        if (p.onSession.starting === null) return {...p, onSession: {starting: n, last: n}}
        if (p.onSession.last + MIN_SESSION_GAP >= n) return {...p, onSession: {...p.onSession, last: n}}
        if (p.onSession.last + MIN_SESSION_GAP < n){
          return {
            sessions: [...p.sessions, p.onSession],
            onSession: {starting: n, last: n}
          }
        }
      },{
        sessions: [],
        onSession: {
          starting: null
        }
      })
      reducedStore[p] = [...reducedStore[p].sessions, reducedStore[p].onSession]
    })
    return reducedStore
  }

  const filterStore = store => {
    const filteredStore = {}
    Object.keys(store).forEach(p => {
      filteredStore[p] = store[p].filter(s => (s.last - s.starting) > ignoreDurationShorterThan)
    })
    return filteredStore
  }

  const fortifyStore = store => {
    const eventStore = {}
    const timeStore = {}
    Object.keys(store).forEach(p => {
      const totalDuration = store[p].reduce((p, n) => p + (n.last - n.starting), 0)
      const firstOccurance = store[p].reduce((p, n) => Math.min(p, n.starting), Infinity)
      const lastOccurance = store[p].reduce((p, n) => Math.max(p, n.last), -Infinity)
      const chronologicalSets = store[p].reduce((p, n) =>{
        const dateStarting = dateString(n.starting)
        const dateEnding = dateString(n.last)
        if (dateStarting === dateEnding){
          const session = p[dateStarting] || []
          return {
            ...p,
            [dateStarting]: [...session, n]
          }
        } else {
          const earlySession = p[dateStarting] || []
          const lateSession = p[dateEnding] || []
          return {
            ...p,
            [dateStarting]: [...earlySession, {
              ...n,
              last: getDayEnd(n.starting)
            }],
            [dateEnding]: [...lateSession, {
              ...n,
              starting: getDayStart(n.last)
            }],
          }
        }
      }, {})
      eventStore[p] = {
        totalDuration,
        firstOccurance,
        lastOccurance,
        sessions: store[p].map(v => ({...v})),
      }
      for (let key in chronologicalSets){
        if (chronologicalSets.hasOwnProperty(key)){
          timeStore[key] = timeStore[key] || {}
          timeStore[key].events = {
            ...timeStore[key].events,
            [p]: {sessions: chronologicalSets[key]}
          }
        }
      }
    })
    Object.keys(timeStore).forEach(d => {
      const { events }  = timeStore[d]
      let allSessions = []
      let totalActive = 0
      let mostActive = {duration: 0}
      for (let key in events){
        if (events.hasOwnProperty(key)){
          const totalDuration = events[key].sessions.reduce((p, n) => p + (n.last - n.starting), 0)
          const firstOccurance = events[key].sessions.reduce((p, n) => Math.min(p, n.starting), Infinity)
          const lastOccurance = events[key].sessions.reduce((p, n) => Math.max(p, n.last), -Infinity)
          if (totalDuration > mostActive.duration) mostActive = {name: key, duration: totalDuration}
          totalActive += totalDuration
          allSessions = [...allSessions, events[key].sessions.slice()]
          events[key] = {
            ...events[key],
            totalDuration,
            firstOccurance,
            lastOccurance
          }
        }
      }
      timeStore[d] = {
        events,
        totalActive,
        mostActive: mostActive.name
      }
    })
    return {
      eventStore,
      timeStore
    }
  }

  const dummy2 = [
    {proc_name: "abc", timestamp: "2018-07-31 13:58:31"},
    {proc_name: "abc", timestamp: "2018-07-31 13:59:32"},
    {proc_name: "abc", timestamp: "2018-07-31 14:00:35"},
    {proc_name: "abc", timestamp: "2018-07-31 14:01:45"},
    {proc_name: "abc", timestamp: "2018-07-31 14:02:45"},
    {proc_name: "abc", timestamp: "2018-07-31 14:03:48"},
    {proc_name: "abc", timestamp: "2018-07-31 15:09:48"},
    {proc_name: "abc", timestamp: "2018-07-31 15:10:50"},
    {proc_name: "abc", timestamp: "2018-07-31 15:12:05"},
    {proc_name: "abc", timestamp: "2018-07-31 15:13:08"},
    {proc_name: "abc", timestamp: "2018-07-31 15:14:35"},
    {proc_name: "abc", timestamp: "2018-07-31 15:15:38"},
    {proc_name: "abc", timestamp: "2018-07-31 17:58:31"},
    {proc_name: "abc", timestamp: "2018-07-31 17:59:41"},
    {proc_name: "abc", timestamp: "2018-07-31 23:12:10"},
    {proc_name: "qwe", timestamp: "2018-02-11 04:15:38"},
    {proc_name: "qwe", timestamp: "2018-02-11 04:16:39"},
    {proc_name: "qwe", timestamp: "2018-02-11 04:17:41"},
    {proc_name: "qwe", timestamp: "2018-02-11 04:18:50"},
    {proc_name: "qwe", timestamp: "2018-02-17 23:57:38"},
    {proc_name: "qwe", timestamp: "2018-02-17 23:58:44"},
    {proc_name: "qwe", timestamp: "2018-02-17 23:59:49"},
    {proc_name: "qwe", timestamp: "2018-02-18 00:00:58"},
    {proc_name: "qwe", timestamp: "2018-02-18 00:01:41"},
    {proc_name: "qwe", timestamp: "2018-02-18 00:02:50"},
    {proc_name: "qwe", timestamp: "2018-02-18 00:03:53"},
    {proc_name: "qwe", timestamp: "2018-02-18 00:04:58"},
    {proc_name: "qwe", timestamp: "2018-02-18 00:06:02"},
    {proc_name: "qwe", timestamp: "2018-02-21 23:59:32"},
    {proc_name: "qwe", timestamp: "2018-02-22 00:01:01"},
    {proc_name: "qwe", timestamp: "2018-02-22 00:02:28"},
    {proc_name: "qwe", timestamp: "2018-02-22 00:03:42"},
  ]
  const MIN_SESSION_GAP = 60000 * 2
  const ignoreDurationShorterThan = 180000

  const updateRaw = procNames => {
    const now = (new Date()).getTime()
    if (currentStamps.date !== dateString()) currentStamps = {...DEFAULT_CURRENT_STAMPS}
    procNames.map(proc => {
      currentStamps.stamps[proc] = currentStamps.stamps[proc] || []
      currentStamps.stamps[proc].push(now)
    })
  }

  const recalculateDailyCache = () => (
    Object.keys(currentStamps).map(proc => {
      const stamps = currentStamps[proc]
      const calculated = stamps.reduce(/* Reduce here */)
      return calculated
    })
  )

  return {
    initializeCache : data => {cache = buildCache(data)},
    updateCache : procNames => {updateRaw(procNames); cache = {...cache, today: recalculateDailyCache()}}
  }
}
