
const Datastore = require('nedb')
const path = require('path')

// const isDevelopment = process.env.NODE_ENV !== 'production'

function loadDB (path) {
  return new Datastore({
    filename: path,
    autoload: true
  })
}

export {
  loadDB
}
