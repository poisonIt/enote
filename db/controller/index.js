const { remote } = require('electron')
const LinvoDB = require('linvodb3')
const path = require('path')

LinvoDB.defaults.store = { db: require('level-js') }
console.log(remote.app.getAppPath('userData'))
LinvoDB.dbPath = path.resolve(remote.app.getAppPath('userData'), '../database')

export {
  LinvoDB
}
