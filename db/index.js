import LocalDAO from './api'
const fs = require('fs')
const Datastore = require('nedb')
const LinvoDB = require('linvodb3')

LinvoDB.defaults.store = { db: require('leveldown') }

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
  LocalDAO[name].createCollection(path)
}

export {
  loadDB,
  LinvoDB,
  loadLinvoDB,
  createCollection
}
