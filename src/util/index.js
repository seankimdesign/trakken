export const log = (type, msg) => {
  let prefix = '[INFO] '
  let fn = console.log
  switch (type.toLowerCase()){
    case 'warn':
      prefix = '[WARN] '
      fn = console.warn
      break
    case 'error':
      prefix = '[ERROR]'
      fn = console.error
      break
  }
  if (typeof msg === "undefined" && prefix === '[INFO] '){
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
