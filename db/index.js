
const Datastore = require('nedb')

function loadDB (path) {
  return new Datastore({
    filename: path,
    autoload: true
  })
}

export {
  loadDB
}
