import sqlite3 from 'sqlite3'

export const initializeDatabase = cb => {
  let db
  db = new sqlite3.Database('./test.db', err => {
    if (err) {
      console.error(err.message)
      return null
    }
    console.log('Connected to the database')

    db.run(`CREATE TABLE if not exists stamps (id INTEGER PRIMARY KEY AUTOINCREMENT, proc_name TEXT, timestamp TEXT)`, err => {
      if (err) {
        console.error(err.message)
        return null
      }
      console.log('Created table')

      cb(db)
    })
  })
}

export const _saveStamps = db => procNames => {
  const queryString =
    `INSERT INTO stamps (proc_name, timestamp)
    VALUES ${procNames.map(name =>
    `("${name}", datetime('now', 'localtime'))`
  )}`
  return new Promise((resolve, reject) => {
    db.run(queryString, err => {
      if (err) {
        console.error(err.message)
        reject(err)
      }
      console.log(`Inserted stamps for: ${procNames.join(', ')}`)
      resolve(true)
    })
  })
}

export const _saveStamp = db => procName => _saveStamps([procName])

export const _getStamps = db => () =>
  new Promise((resolve, reject) => {
    db.all(`SELECT proc_name, timestamp from stamps`, (err, rows) => {
      if (err) {
        console.error(err.message)
        reject(err)
      }
      resolve(rows)
    })
  })

export const close = db => () => {
  db.close(err => {
    if (err) {
      console.error(err.message)
    }
    console.log('Database connection closed')
  })
}
