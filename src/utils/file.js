var fs = require('fs')

const readFile = function (path) {
  fs.readFileSync(path, 'utf8', function (err, data) {
    console.log(data)
  })
}

const writeFile = function (path, data) {
  fs.writeFileSync(path, data)
}

export {
  readFile,
  writeFile
}
