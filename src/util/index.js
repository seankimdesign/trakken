export const log = (type, msg) => {
  let prefix = '[INFO] '
  let fn = console.log
  switch (type.toLowerCase()) {
    case 'warn':
      prefix = '[WARN] '
      fn = console.warn
      break
    case 'error':
      prefix = '[ERROR]'
      fn = console.error
      break
  }
  if (typeof msg === 'undefined' && prefix === '[INFO] ') {
    console.log(prefix + type)
  } else {
    fn(prefix + msg)
  }
}

export const dump = obj => {
  console.group('Object dump')
  Object.entries(obj).map(v => console.log(v.toString()))
  console.groupEnd()
}

export const dateString = timestamp => {
  const now = typeof timestamp === 'undefined' ? new Date() : new Date(timestamp)
  const date = pad(now.getDate())
  const month = pad((now.getMonth() + 1))
  const year = now.getFullYear()
  return `${year}-${month}-${date}`
}

export const getDayEnd = timestamp => {
  let dateObject = new Date(timestamp)
  dateObject.setHours(23)
  dateObject.setMinutes(59)
  dateObject.setSeconds(59)
  dateObject.setMilliseconds(999)
  return dateObject.getTime()
}

export const getDayStart = timestamp => getDayEnd(timestamp) - 86399999

export const pad = str => ('0' + str).substr(-2)
