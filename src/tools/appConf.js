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
      ).then(conf => {
        resolve(conf)
      })
    })
  })
}

export function saveAppConf (appPath, conf) {
  return new Promise((resolve, reject) => {
    writeFile(path.resolve(appPath,
      `../appConfig.json`),
      JSON.stringify(conf)
    ).then(conf => {
      resolve(conf)
    })
  })
}
