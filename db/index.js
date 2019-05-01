import LocalDAO from './api'
const Datastore = require('nedb')
const LinvoDB = require('linvodb3')

LinvoDB.defaults.store = { db: require('level-js') }

function loadDB (path) {
  return new Datastore({
    filename: path,
    autoload: true
  })
}

function loadLinvoDB (path) {
  LinvoDB.dbPath = path
  return LinvoDB
}

function createCollection (name, path) {
  console.log('createCollection', name, path, LocalDAO[name])
  LocalDAO[name].createCollection(path)
}

export {
  loadDB,
  LinvoDB,
  loadLinvoDB,
  createCollection
}
