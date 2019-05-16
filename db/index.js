import LocalDAO from './api'
const fs = require('fs')
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
  console.log('isExist', fs.existsSync(path))
  let isDirExist = fs.existsSync(path)
  if (!isDirExist) {
    fs.mkdir(path, { recursive: true }, (err) => {
      console.log('createCollection', name, path, LocalDAO[name])
      LocalDAO[name].createCollection(path)
    })
  } else {
    console.log('createCollection', name, path, LocalDAO[name])
    LocalDAO[name].createCollection(path)
  }
}

export {
  loadDB,
  LinvoDB,
  loadLinvoDB,
  createCollection
}
