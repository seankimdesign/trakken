import sqlite3 from 'sqlite3'

export const initializeDatabase = cb => {
  let db
  db = new sqlite3.Database('./test.db', err => {
    if (err) {
      console.error(err.message)
      return null
    }
    console.log('Connected to the database')

    db.run(`CREATE TABLE if not exists stamps (id INTEGER PRIMARY KEY AUTOINCREMENT, proc_id TEXT, timestamp TEXT)`, err => {
      if (err) {
        console.error(err.message)
        return null
      }
      console.log('Created table')

      cb(db)
    })
  })
}

export const _saveStamp = db => procId =>
  new Promise((resolve, reject) => {
    db.run(`INSERT INTO stamps (proc_id, timestamp) VALUES (${procId}, datetime('now', 'localtime'))`, err => {
      if (err) {
        console.error(err.message)
        reject(err)
      }
      console.log(`Inserted stamp: ${procId}`)
      resolve()
    })
  })

export const _getStamps = db => () =>
  new Promise((resolve, reject) => {
    db.all(`SELECT proc_id, timestamp from stamps`, (err, rows) => {
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
