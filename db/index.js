
const Datastore = require('nedb')
const path = require('path')

// const isDevelopment = process.env.NODE_ENV !== 'production'

function loadDB (app) {
  let filesDB = null
  let docsDB = null

  filesDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/files.db'),
    autoload: true
  })

  docsDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/docs.db'),
    autoload: true
  })

  return {
    filesDB,
    docsDB
  }
}

export {
  loadDB
}
