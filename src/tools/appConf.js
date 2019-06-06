import path from 'path'
import { readFile, writeFile } from '../utils/file'

export function getAppConf (appPath) {
  return new Promise((resolve, reject) => {
    readFile(path.resolve(appPath, `../appConfig.json`)).then(res => {
      resolve(JSON.parse(res))
    }).catch(err => {
      writeFile(path.resolve(appPath,
        `../appConfig.json`),
        JSON.stringify({
          user: null
        })
      ).then((err) => {
        resolve({
          user: null
        })
      })
    })
  })
}

export function saveAppConf (appPath, conf) {
  return new Promise((resolve, reject) => {
    getAppConf(appPath).then(c => {
      Object.keys(conf).forEach(key => {
        c[key] = conf[key]
      })
      writeFile(path.resolve(appPath,
        `../appConfig.json`),
        JSON.stringify(c)
      ).then(c => {
        resolve(c)
      })
    })
  })
}
