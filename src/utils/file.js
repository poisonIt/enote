var fs = require('fs')

const readFile = function (path, cb) {
  return new Promise ((resolve, reject) => {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        reject(err)
      }
      fs.stat(path, function (err, stats) {
        if (err) {
          reject(err)
        }
        resolve({
          data: data,
          size: stats.size
        })
      })
    })
  })
}

const writeFile = function (path, data) {
  return new Promise ((resolve, reject) => {
    fs.writeFile(path, data, function (err, data) {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

export {
  readFile,
  writeFile
}
