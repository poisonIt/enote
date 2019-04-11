
const Datastore = require('nedb')
const path = require('path')

// const isDevelopment = process.env.NODE_ENV !== 'production'

function loadDB (app) {
  let structureDB = null
  let filesDB = null
  let docsDB = null
  let tagsDB = null
  let topsDB = null

  structureDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/structure.db'),
    autoload: true
  })

  filesDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/files.db'),
    autoload: true
  })

  docsDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/docs.db'),
    autoload: true
  })

  tagsDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/tags.db'),
    autoload: true
  })

  topsDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/tops.db'),
    autoload: true
  })

  return {
    structureDB,
    filesDB,
    docsDB,
    tagsDB,
    topsDB
  }
}

export {
  loadDB
}
