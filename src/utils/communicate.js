import { ipcRenderer } from 'electron'

let fid = 0
let cbPool = Object.create(null)

ipcRenderer.on('fetch-local-response', (event, arg) => {
  console.log('fetch-local-response', arg)
  console.log('cbPool', cbPool)
  cbPool[fid](null, arg.res)
  delete cbPool[fid]
})

function fetchLocal (taskName, from) {
  let cb = arguments[arguments.length - 1]
  let params
  let options

  if (arguments.length === 4) {
    params = arguments[2]
  }
  if (arguments.length === 5) {
    params = arguments[2]
    options = arguments[3]
  }

  let req = {
    fid: ++fid,
    taskName: taskName,
    from: from
  }

  if (params) {
    req.params = params
  }
  if (options) {
    req.options = options
  }

  cbPool[fid] = cb

  ipcRenderer.send('fetch-local', req)
}

function promisify (func, ctx) {
  return function () {
    let ctx = ctx || this
    return new Promise((resolve, reject) => {
      func.call(ctx, ...arguments, function() {
        let args = Array.prototype.map.call(arguments, item => item)
        let err = args.shift()
        if (err) {
          reject(err)
        } else {
          args = args.length > 1 ? args : args[0]
          resolve(args)
        }
      })
    })
  }
}

fetchLocal = promisify(fetchLocal)

export {
  fetchLocal
}
