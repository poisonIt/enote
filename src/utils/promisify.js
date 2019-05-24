export default function promisify (func, ctx) {
  return function () {
    let ctx = this
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
