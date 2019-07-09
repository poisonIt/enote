import { ipcRenderer } from 'electron'
import promisify from './promisify'

let fid = 0
let cbPool = Object.create(null)

ipcRenderer.on('fetch-ipc-response', (event, arg) => {
  cbPool[arg.fid] && cbPool[arg.fid].call(this, null, arg.res)
  console.log('fetch-ipc-response', arg)
  delete cbPool[arg.fid]
})

function fetchIpc (taskName) {
  let cb = arguments[arguments.length - 1]
  let params
  let options

  if (arguments.length === 3) {
    params = arguments[1]
  }
  if (arguments.length === 4) {
    params = arguments[1]
    options = arguments[2]
  }

  let req = {
    fid: ++fid,
    taskName: taskName
  }

  if (params) {
    req.params = params
  }
  if (options) {
    req.options = options
  }

  cbPool[fid] = cb

  ipcRenderer.send('fetch-ipc', req)
}

fetchIpc = promisify(fetchIpc)

export default fetchIpc
