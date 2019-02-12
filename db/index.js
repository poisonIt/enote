
const Datastore = require('nedb')
const path = require('path')

function db (app) {
  const files_db = new Datastore({
    filename: path.join(app.getAppPath(), 'db/files.db')
  })

  files_db.loadDatabase(function (err) {    // Callback is optional
    // Now commands will be executed
    if (err) {
      console.error(err)
    } else {
      console.log('db loaded')
    }
  })

  return {
    files_db: files_db
  }
}

export {
  db
}
