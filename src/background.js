'use strict'
import os from 'os'
import path from 'path'
import fs from 'fs'
import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  dialog,
  shell,
  Tray,
  ipcMain } from 'electron'
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib'
import { getAppConf, saveAppConf } from './tools/appConf'
import { createCollection } from '../db'
import { GenNonDuplicateID } from './utils/utils'
import * as LocalService from './service/local'
import ipcHandlers from './client/ipcHandlers'
import { applicationMenuTemplate, contextMenuTemplate } from './client/menu.js'

const electron = require('electron')

const productName = require('../vue.config.js').pluginOptions.electronBuilder.builderOptions.productName
const isDevelopment = process.env.NODE_ENV !== 'production'

process.once('loaded', () => {
  console.log(`process ${process.type} loaded.`)
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let loginWin
let previewWin
let pdfWin
let youdaoWin
let testWin

let tray
let isHomeVisible = false
let pdfPath

let downLoadPath//下载路径
let downType //下载方式

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

  if (win && !win.isVisible() && isHomeVisible) {
    win.show()
  }
  if (loginWin && !loginWin.isVisible() && !isHomeVisible) {
    loginWin.show()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  electron.powerMonitor.on('shutdown', (e) => {
    e.preventDefault()
    appQuit()
  })

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }

  tray = new Tray(path.join(__static, 'icon.png'))

  const appMenu = Menu.buildFromTemplate(applicationMenuTemplate)
  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate)
  Menu.setApplicationMenu(appMenu)
  tray.setToolTip(productName)
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (isHomeVisible) {
      win && win.show()
    }
    loginWin && loginWin.show()
  })

  let dbPath = path.resolve(app.getAppPath('userData'), `../`)
  // let dbPath = '/Users/bowiego/Documents/workspace/enote/temp'
  // let serviceUrl = 'https://iapp.htffund.com/note/api'
  // let serviceUrl = isDevelopment
    // ? 'http://10.50.16.123:8000/api'
    // : 'https://iapp.htffund.com/note/api'
  let serviceUrl = 'http://10.50.16.123:8000/api'

  let appConf = await getAppConf(app.getAppPath('userData'))
  if (!appConf.serviceUrl || appConf.serviceUrl === '') {
    await saveAppConf(app.getAppPath('userData'), {
      serviceUrl: serviceUrl,
      appPath: dbPath
    })
  }
  if (!appConf.clientId || appConf.clientId === '') {
    let clientId = GenNonDuplicateID(6)
    appConf.clientId = clientId
    await saveAppConf(app.getAppPath('userData'), {
      clientId: clientId
    })
  }
  if (isDevelopment) {
    if (!appConf.hasOwnProperty('devTool')) {
      appConf.devTool = '1'
    }
  }
  let defaultSize = [1000, 640]
  if (appConf.size) {
    defaultSize[0] = appConf.size.width || 1000
    defaultSize[1] = appConf.size.height || 640
  }
  let p = dbPath + '/database'
  app.appConf = {
    name: productName,
    user: appConf.user,
    dbPath: p,
    resourcePath: dbPath + '/resource',
    serviceUrl: appConf.serviceUrl || serviceUrl,
    note_ver: 1,
    dev_url: process.env.WEBPACK_DEV_SERVER_URL,
    dev_tool: appConf.devTool === '1',
    size: {
      x: 0,
      y: 0,
      width: defaultSize[0],
      height: defaultSize[1]
    },
    clientId: appConf.clientId,
    deviceName: os.hostname(),
    platform: os.platform(),
    osUser: os.userInfo().username
  }

  fs.mkdir(p, { recursive: true }, (err) => {
    if (err) {
      console.log(err)
    }
    createCollection('user', p)
    createLoginWindow(appConf.user)
    createHomeWindow()
  })
})

app.on('before-quit', () => {
  beforeQuit()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// process communicate
ipcMain.on('appQuit', (event, arg) => {
  appQuit()
})

ipcMain.on('logout', (event, arg) => {
  logout()
})

ipcMain.on('hideWindow', (event, arg) => {
})

ipcMain.on('closeHomeWindow', (event, arg) => {
  win && win.destroy()
})

ipcMain.on('reloadHomeWindow', (event, arg) => {
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/home')
  } else {
    win.loadURL('app://./index.html#/home')
  }
})

ipcMain.on('showWindow', (event, arg) => {
})

ipcMain.on('login-ready', (event, arg) => {
  connectDatabase().then(() => {
    isHomeVisible = showHomeWindow()
  })
})

ipcMain.on('pull-finished', (event, arg) => {
  // if (!isDevelopment) {
  loginWin && loginWin.hide()
  // }
  isHomeVisible = showHomeWindow()
})

ipcMain.on('create-home-window', (event, arg) => {
  // if (!isDevelopment) {
  loginWin && loginWin.hide()
  // }
  createHomeWindow()
})

ipcMain.on('create-preview-window', (event, arg) => {
  // console.log(event, arg)
  createPreviewWindow(event, arg)
})

ipcMain.on('create-youdao-window', (event, arg) => {
  if (arg.name === 'youdao') {
    createYoudaoAsyncWindow(event, arg.url)
  }
})

ipcMain.on('update-user-data', (event, arg) => {
  LocalService.updateLocalUser(arg).then(res => {
    app.appConf.user = res._id
    saveAppConf(app.getAppPath('appData'), {
      user: res._id
    })
    loginWin.webContents.send('update-user-data-response')
  })
})

ipcMain.on('fetch-user-data', (event, arg) => {
  LocalService.getLocalUserById({ id: app.appConf.user }).then(res => {
    win && win.webContents.send('fetch-user-data-response', {
      res: res,
      from: arg.from
    })
  })
})

ipcMain.on('fetch-local', (event, arg) => {
  let option = arg.options || {}
  let args = [option]
  if (arg.params) {
    args.unshift(arg.params)
  }

  LocalService[arg.taskName].call(this, ...args).then(res => {
    arg.res = res
    event.sender.send('fetch-local-response', arg)
  })
})

ipcMain.on('communicate', (event, arg) => {
  win && win.webContents.send('communicate', arg)
})

ipcMain.on('print-to-pdf', (event, arg) => {
  const win = BrowserWindow.fromWebContents(event.sender)

  // const pdfPath = path.join(os.tmpdir(), 'print.pdf')
  // console.log('pdfPath', pdfPath)
  dialog.showSaveDialog(win, { title: 'pdf.pdf' }, path => {
    console.log('path', path)
    pdfPath = path
    createPreviewWindow(event, arg)
    // event.sender.send('wrote-pdf', targetPath)
  })

  // win.webContents.printToPDF({}, function (error, data) {
  //   if (error) throw error
  //   fs.writeFile(pdfPath, data, function (error) {
  //     if (error) {
  //       throw error
  //     }
  //     shell.openExternal('file://' + pdfPath)
  //   })
  // })
})

ipcMain.on('wrote-pdf', (event, arg) => {
  previewWin.webContents.printToPDF({}, (err, data) => {
    if (err) throw err
    fs.writeFile(pdfPath, data, function (error) {
      if (error) {
        throw error
      }
      previewWin && previewWin.destroy()
      shell.openExternal('file://' + pdfPath)
    })
  })
})

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url)
})

ipcMain.on('fetch-ipc', (event, arg) => {
  let option = arg.options || {}
  let args = [option]
  if (arg.params) {
    args.unshift(arg.params)
  }

  ipcHandlers[arg.taskName].call(this, ...args).then(res => {
    arg.res = res
    event.sender.send('fetch-ipc-response', arg)
  })
})

//主进程代码
ipcMain.on('download', (event, args) => {
  // console.log('download---->',args)
  var arr = args.split("+");
  downLoadPath = arr[0];
  downType = arr[1];

  //下面这句会触发will-download事件
  win.webContents.downloadURL(downLoadPath)
})

function prepareCreateLogin (user) {
  return new Promise((resolve, reject) => {
    let autoLogin = '0'
    let data = {
      username: '',
      password: ''
    }
    if (user && user !== 'null') {
      LocalService.getLocalUserById({ id: user }).then(res => {
        if (res) {
          data.username = res.local_name
          data.password = res.password
          autoLogin = '1'
          resolve({ autoLogin, data })
        } else {
          resolve({ autoLogin, data })
        }
      })
    } else {
      resolve({ autoLogin, data })
    }
  })
}

function createLoginWindow (user) {
  prepareCreateLogin(user).then(res => {
    const { autoLogin, data } = res
    console.log('createLoginWindow', user, autoLogin, data)
    if (autoLogin === '1') {
      win && win.show()
      isHomeVisible = true
    }
    loginWin = new BrowserWindow({
      id: 'login',
      width: isDevelopment ? 1024 : 442,
      height: 490,
      frame: false,
      resizable: isDevelopment,
      show: isDevelopment,
      titleBarStyle: 'hidden',
      icon: path.join(__static, 'icon.png'),
      webPreferences: {
        webSecurity: false
      }
    })
    loginWin.setMinimumSize(442, 490)

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      loginWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}#/?autoLogin=${autoLogin}&username=${data.username}&password=${data.password}`)
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      loginWin.loadURL(`app://./index.html#/?autoLogin=${autoLogin}&username=${data.username}&password=${data.password}`)
    }

    if (app.appConf.dev_tool) {
      loginWin.webContents.openDevTools()
    }

    loginWin.on('show', (event) => {
      loginWin.focus()
    })

    loginWin.on('closed', () => {
      loginWin = null
      if (win && !win.isVisible()) {
        app.quit()
      }
    })
  })
}

function createHomeWindow () {
  isHomeVisible = false
  // Create the browser window.
  win = new BrowserWindow({
    id: 'home',
    width: app.appConf.size.width,
    height: app.appConf.size.height,
    backgroundColor: '#fcfbf7',
    show: false,
    title: productName,
    frame: false,
    titleBarStyle: isDevelopment ? 'hidden' : 'hidden',
    icon: path.join(__static, 'icon.png'),
    webPreferences: {
      webSecurity: false
    }
  })

  win.setMinimumSize(960, 640)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/home')
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html#/home')
  }

  if (app.appConf.dev_tool) {
    win.webContents.openDevTools()
  }

  win.on('show', (event) => {
    win.focus()
  })

  win.on('closed', (event) => {
    win = null
  })

  win.on('destroy', (event) => {
    let sizeInteger = win.getSize()
    saveAppConf(app.getAppPath('userData'), {
      size: {
        width: sizeInteger[0],
        height: sizeInteger[1]
      }
    })
  })

  win.webContents.session.on('will-download', (event, item, webContents) => {
    //设置文件存放位置，如果用户没有设置保存路径，Electron将使用默认方式来确定保存路径（通常会提示保存对话框）
    // console.log(item)
    // item.setSavePath(savePath + item.getFilename())

    const filePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(filePath);

    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused')
        } else {
          //添加进度显示
          // console.log(item.getSavePath(),item.getFilename(), item.getReceivedBytes(), item.getTotalBytes())
          win.webContents.send("down-done", {
            name: item.getFilename(),
            receive: item.getReceivedBytes(),
            total: item.getTotalBytes(),
            savePath: item.getSavePath()
          })

          win.setProgressBar(item.getReceivedBytes() / item.getTotalBytes())
            // (item.getReceivedBytes() / item.getTotalBytes() * 100).toFixed(2) + "%"
          console.log(`Received bytes: ${item.getReceivedBytes()}`)
        }
      }
    })
    item.once('done', (event, state) => {

      if (state === 'completed') {
        console.log('Download successfully')
        if (!win.isDestroyed()) {
          win.setProgressBar(-1);
        }

        if (downType === 'all') {
          shell.showItemInFolder(filePath)
        } else {
          shell.showItemInFolder(filePath) && shell.openItem(filePath) //下载完成后以默认打开方式打开文件
        }

        // shell.showItemInFolder(filePath) && shell.openItem(filePath) //下载完成后以默认打开方式打开文件

        //回显 调用渲染进程方法
        win.webContents.send('downstate', state)
      } else {
        console.log(`Download failed: ${state}`)
        //回显 调用渲染进程方法
        win.webContents.send('downstate', state)
      }
    })
  })
}

function createPreviewWindow (event, arg) {
  // console.log(arg)
  previewWin = new BrowserWindow({
    id: 'preview',
    width: 960,
    height: 640,
    title: '笔记预览',
    show: arg.isPdf !== '1',
    backgroundColor: '#fcfbf7',
    titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: false
    }
  })
  previewWin.setMinimumSize(640, 640)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    previewWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + `#/preview?note_id=${arg.noteId}&title=${arg.title}&isPdf=${arg.isPdf}&isReadOnly=${arg.isReadOnly}`)
    // previewWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    previewWin.loadURL(`app://./index.html#/preview?note_id=${arg.noteId}&title=${arg.title}&isReadOnly=${arg.isReadOnly}`)
  }
    // console.log(arg)

  previewWin.on('closed', () => {
    previewWin = null
    win && win.webContents.send('communicate', {
      tasks: ['pushData'],
      from: 'Preview',
      type: arg.type
    })
  })
}

function createPdfWin (event, arg) {
  pdfWin = new BrowserWindow({
    id: 'preview',
    width: 960,
    height: 640,
    title: 'PDF',
    show: isDevelopment,
    backgroundColor: '#fcfbf7',
    titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    pdfWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + `#/pdf?note_id=${arg.noteId}&title=${arg.title}`)
    // pdfWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    pdfWin.loadURL(`app://./index.html#/pdf?note_id=${arg.noteId}&title=${arg.title}`)
  }

  pdfWin.on('closed', () => {
    pdfWin = null
  })
}

function createYoudaoAsyncWindow (event, url) {
  youdaoWin = new BrowserWindow({
    id: 'youdao',
    width: 960,
    height: 640,
    title: '绑定有道云账号',
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false
    }
  })
  youdaoWin.setMinimumSize(960, 640)
  youdaoWin.loadURL(url)

  youdaoWin.on('closed', () => {
    youdaoWin = null
  })

  // 清除Web storage的数据。主要清除cookies
  const ses = youdaoWin.webContents.session
  ses.clearStorageData()
}

function createTestWindow () {
  if (testWin) return
  testWin = new BrowserWindow({
    id: 'test',
    width: app.appConf.size.width,
    height: app.appConf.size.height,
    backgroundColor: '#fcfbf7',
    show: true,
    title: 'TestGround',
    // frame: false,
    titleBarStyle: 'default',
    webPreferences: {
      webSecurity: false
    }
  })

  testWin.setMinimumSize(960, 640)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    testWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/test')
    testWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    testWin.loadURL('app://./index.html#/test')
  }

  testWin.on('closed', (event) => {
    testWin = null
  })
}

function showHomeWindow () {
  win && win.show()
  win && win.webContents.send('login-ready')
  // if (!isDevelopment) {
  loginWin && loginWin.destroy()
  // }
  return true
  // if (!isDevelopment) {
  //   loginWin && loginWin.destroy()
  // } else {
  //   // createTestWindow()
  // }
}

function connectDatabase () {
  const dbs = ['folder', 'note', 'sharedNote','publicNote', 'doc', 'tag', 'img', 'state']

  return new Promise((resolve, reject) => {
    let p = app.appConf.dbPath + '/' + app.appConf.user
    fs.mkdir(p, { recursive: true }, (err) => {
      if (err) {
        console.log(err)
      }
      dbs.forEach(db => {
        createCollection(db, p)
      })

      LocalService.getLocalState().then(res => {
        console.log('getLocalState', res)
        app.appConf.note_ver = res.note_ver
        resolve()
      })
    })
  })
}

function beforeQuit () {
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

function appQuit () {
  beforeQuit()
  win && win.destroy()
  loginWin && loginWin.destroy()
  previewWin && previewWin.destroy()
  youdaoWin && youdaoWin.destroy()
  app.quit()
}

function logout () {
  if (win) {
    saveAppConf(app.getAppPath('appData'), {
      user: null
    })
    restart()
  }
}

function restart () {
  if (win) {
    win && win.hide()
    BrowserWindow.getAllWindows().forEach(window => {
      if (window.id !== win.id) {
        window.destroy()
      }
    })
    createLoginWindow()
    setTimeout(() => {
      win && win.destroy()
      createHomeWindow()
      // createLoginWindow()
    }, 500)
  } else {
    // if (!loginWin) {
    //   createLoginWindow()
    // }
    BrowserWindow.getAllWindows().forEach(window => {
      if (window.id !== loginWin.id) {
        window.destroy()
      }
      loginWin.webContents.reload()
    })
  }
}

export {
  createHomeWindow,
  createLoginWindow,
  appQuit,
  logout
}
