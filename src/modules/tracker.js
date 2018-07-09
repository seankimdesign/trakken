import tasklist from 'tasklist'

const stamp = processId => (
  {
    time: (new Date()).getTime(),
    id: processId
  }
)

export default processIds => {
  console.log('-> Scan in progress')
  return new Promise(resolve => {
    tasklist().then(tasks => {
      resolve(tasks.filter(t => (
        t.imageName &&
        typeof t.imageName === 'string' &&
        processIds.some(id => (
          t.imageName.toLowerCase().includes(id)
        ))
      )).map(t => stamp(t.imageName)))
    })
  })
}
