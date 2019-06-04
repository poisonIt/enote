import fs from 'fs'
import {
  app
} from 'electron'
import { createCollection } from '../../db'
import * as LocalService from '../service/local'
import { saveAppConf } from '../tools/appConf'
import {
  win,
  loginWin,
  previewWin,
  youdaoWin
} from '../background'

export function connectDatabase () {
  return new Promise((resolve, reject) => {
    let p = app.appConf.dbPath + '/' + app.appConf.user
    fs.mkdir(p, { recursive: true }, (err) => {
      if (err) {
        console.log(err)
      }
      createCollection('folder', p)
      createCollection('note', p)
      createCollection('doc', p)
      createCollection('tag', p)
      createCollection('img', p)
      createCollection('state', p)

      LocalService.getLocalState().then(res => {
        console.log('getLocalState', res)
        app.appConf.note_ver = res.note_ver
        resolve()
      })
    })
  })
}

export function showHomeWindow () {
  win && win.show()
  win && win.webContents.send('login-ready')
  loginWin && loginWin.destroy()
  return true
  // if (!isDevelopment) {
  //   loginWin && loginWin.destroy()
  // } else {
  //   // createTestWindow()
  // }
}

export function beforeQuit () {
  if (win) {
    let sizeInteger = win.getSize()
    saveAppConf(app.getAppPath('userData'), {
      size: {
        width: sizeInteger[0],
        height: sizeInteger[1]
      }
    })
  }
}

export function appQuit () {
  beforeQuit()
  win && win.destroy()
  loginWin && loginWin.destroy()
  previewWin && previewWin.destroy()
  youdaoWin && youdaoWin.destroy()
  app.quit()
}
