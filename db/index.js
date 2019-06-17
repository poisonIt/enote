import LocalDAO from './api'
const LinvoDB = require('linvodb3')

LinvoDB.defaults.store = { db: require('medeadown') }

function createCollection (name, path) {
  LocalDAO[name].createCollection(path)
}

export {
  LinvoDB,
  createCollection
}
