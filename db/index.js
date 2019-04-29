
const Datastore = require('nedb')

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
