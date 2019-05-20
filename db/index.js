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

function createCollection (name, user) {
  LocalDAO[name].createCollection(user)
}

export {
  loadDB,
  LinvoDB,
  loadLinvoDB,
  createCollection
}
