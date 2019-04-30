const { remote } = require('electron')
const LinvoDB = require('linvodb3')
const path = require('path')

LinvoDB.defaults.store = { db: require('level-js') }
LinvoDB.dbPath = path.resolve(remote.app.getAppPath('userData'), '../database')

export {
  LinvoDB
}
