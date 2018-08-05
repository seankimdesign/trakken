import flow from 'lodash/flow'
import { dateString, getDayEnd, getDayStart } from '../util'

export default ({
  trackingInterval,
  trackingTimeout,
  ignoreDurationShorterThan
}) => {
  const MIN_SESSION_GAP = (trackingInterval * 1.5) + trackingTimeout

  const DEFAULT_CURRENT_STAMPS = {
    stamps: {},
    date: dateString()
  }

  let cache = {}
  let currentStamps = {...DEFAULT_CURRENT_STAMPS}

  const buildCache = rows => {
    const today = dateString()
    const filteredRows = rows.reduce((p, n) => {
      const designation = n.timestamp.substr(0, 10) === today ? 'today' : 'past'
      return {...p, [designation]: [...p[designation], n]}
    }, {past: [], today: []})
    const { eventStore, timeStore } = flow([buildStore, reduceStampsIntoSessions, filterStore, fortifyStore])(filteredRows.past)
    currentStamps.stamps = convertDailyRaw(filteredRows.today)
    return {
      eventStore,
      timeStore,
      today: recalculateDailyCache(),
      updated: (new Date()).getTime()
    }
  }

  const buildStore = rows => {
    const store = {}
    rows.forEach(r => {
      const proc = r.proc_name
      store[proc] = store[proc] || []
      store[proc].push(new Date(r.timestamp).getTime())
    })
    for (let key in store) {
      if (store.hasOwnProperty(key)) store[key].sort()
    }
    return store
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
      const chronologicalSets = store[p].reduce((p, n) => {
        const dateStarting = dateString(n.starting)
        const dateEnding = dateString(n.last)
        if (dateStarting === dateEnding) {
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
            }]
          }
        }
      }, {})
      eventStore[p] = {
        totalDuration,
        firstOccurance,
        lastOccurance,
        sessions: store[p].map(v => ({...v}))
      }
      for (let key in chronologicalSets) {
        if (chronologicalSets.hasOwnProperty(key)) {
          timeStore[key] = timeStore[key] || {}
          timeStore[key].events = {
            ...timeStore[key].events,
            [p]: {sessions: chronologicalSets[key]}
          }
        }
      }
    })
    Object.keys(timeStore).forEach(d => {
      const { events } = timeStore[d]
      let allSessions = []
      let totalActive = 0
      let mostActive = {duration: 0}
      for (let key in events) {
        if (events.hasOwnProperty(key)) {
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

  const reduceStampsIntoSessions = stamps => {
    const sessions = {}
    Object.keys(stamps).forEach(p => {
      sessions[p] = stamps[p].reduce((p, n) => {
        if (p.onSession.starting === null) return {...p, onSession: {starting: n, last: n}}
        if (p.onSession.last + MIN_SESSION_GAP >= n) return {...p, onSession: {...p.onSession, last: n}}
        if (p.onSession.last + MIN_SESSION_GAP < n) {
          return {
            sessions: [...p.sessions, p.onSession],
            onSession: {starting: n, last: n}
          }
        }
      },
      {
        sessions: [],
        onSession: {
          starting: null
        }
      })
      sessions[p] = [...sessions[p].sessions, sessions[p].onSession]
    })
    return sessions
  }

  const convertDailyRaw = stamps =>
    stamps.reduce((p, n) => {
      p[n.proc_name] = p[n.proc_name] || []
      p[n.proc_name].push(new Date(n.timestamp).getTime())
      return p
    }, {})

  const updateDailyRaw = procNames => {
    const now = (new Date()).getTime()
    if (currentStamps.date !== dateString()) currentStamps = {...DEFAULT_CURRENT_STAMPS}
    procNames.map(proc => {
      currentStamps.stamps[proc] = currentStamps.stamps[proc] || []
      currentStamps.stamps[proc].push(now)
    })
  }

  const recalculateDailyCache = () => {
    const { stamps } = currentStamps
    return reduceStampsIntoSessions(stamps)
  }

  return {
    initializeCache: data => { cache = buildCache(data) },
    updateCache: procNames => {
      try {
        updateDailyRaw(procNames)
        cache = {...cache, today: recalculateDailyCache()}
        console.log(JSON.stringify(cache.eventStore))
        console.log(JSON.stringify(cache.timeStore))
        console.log(JSON.stringify(cache.today))
        console.log('----- ^ caches')
        return true
      } catch (e) {
        return e
      }
    }
  }
}
