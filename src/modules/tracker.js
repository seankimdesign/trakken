import { log } from '../util'
import tasklist from 'tasklist'

/*
** Return an array of process names
*/

export default processIds => {
  log('Scan in progress')
  return new Promise(resolve => {
    tasklist().then(tasks => {
      resolve(tasks.filter(t => (
        t.imageName &&
        typeof t.imageName === 'string' &&
        processIds.some(id => (
          t.imageName.toLowerCase().includes(id)
        ))
      )))
    })
  })
}
