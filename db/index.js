
const Datastore = require('nedb')
const path = require('path')

// const isDevelopment = process.env.NODE_ENV !== 'production'

function loadDB (app) {
  let userDB = null
  let structureDB = null
  let filesDB = null
  let docsDB = null
  let tagsDB = null
  let imgsDB = null

  userDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/user.db'),
    autoload: true
  })

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

  imgsDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/imgs.db'),
    autoload: true
  })

  return {
    userDB,
    structureDB,
    filesDB,
    docsDB,
    tagsDB,
    imgsDB
  }
}

export {
  loadDB
}
