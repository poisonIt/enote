
const Datastore = require('nedb')
const path = require('path')

// const isDevelopment = process.env.NODE_ENV !== 'production'

function loadDB (app) {
  const userDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/user.db'),
    autoload: true
  })

  const folderDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/folder.db'),
    autoload: true
  })

  const noteDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/note.db'),
    autoload: true
  })

  const docDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/doc.db'),
    autoload: true
  })

  const tagDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/tag.db'),
    autoload: true
  })

  const imgDB = new Datastore({
    filename: path.resolve(app.getAppPath(), '../database/img.db'),
    autoload: true
  })

  return {
    userDB,
    folderDB,
    noteDB,
    docDB,
    tagDB,
    imgDB
  }
}

export {
  loadDB
}
