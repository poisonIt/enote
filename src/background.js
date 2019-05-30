'use strict'
import path from 'path'
import fs from 'fs'
import os from 'os'
import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  dialog,
  session,
  shell,
  ipcMain } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import { getAppConf, saveAppConf } from './tools/appConf'
import { createCollection } from '../db'
import * as LocalService from './service/local'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let loginWin
let previewWin
let pdfWin
let youdaoWin
let testWin

let taskId = 0
let pdfPath

let template = [{
  label: app.getName(),
  submenu: [{
    label: '退出',
    accelerator: 'CmdOrCtrl+Q',
    click: (item, focusedWindow) => {
      beforeQuit()
      win && win.destroy()
      loginWin && loginWin.destroy()
      previewWin && previewWin.destroy()
      youdaoWin && youdaoWin.destroy()
      app.quit()
    }
  }]
}, {
  label: '编辑',
  submenu: [{
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: '重做',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: '剪切',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: '全选',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: '查看',
  submenu: [{
    label: '重载',
    accelerator: 'CmdOrCtrl+R',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        // 重载之后, 刷新并关闭所有之前打开的次要窗体
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(win => {
            if (win.id > 1) win.close()
          })
        }
        focusedWindow.reload()
      }
    }
  }, {
    label: '切换全屏',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }, {
    label: '切换开发者工具',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }, {
    type: 'separator'
  }, {
    label: '应用程序菜单演示',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        const options = {
          type: 'info',
          title: '应用程序菜单演示',
          buttons: ['好的'],
          message: '此演示用于 "菜单" 部分, 展示如何在应用程序菜单中创建可点击的菜单项.'
        }
        dialog.showMessageBox(focusedWindow, options, function () {})
      }
    }
  }]
}, {
  label: '窗口',
  role: 'window',
  submenu: [{
    label: '最小化',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: '重新打开窗口',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: () => {
      app.emit('activate')
    }
  }]
}, {
  label: '帮助',
  role: 'help',
  submenu: [{
    label: '学习更多',
    click: () => {
      shell.openExternal('http://electron.atom.io')
    }
  }]
}]

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })

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
    }
    loginWin = new BrowserWindow({
      id: 'login',
      width: isDevelopment ? 1024 : 442,
      height: 490,
      // frame: false,
      resizable: isDevelopment ? true : false,
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
      loginWin.webContents.openDevTools()
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      loginWin.loadURL(`app://./index.html#/?autoLogin=${autoLogin}&username=${data.username}&password=${data.password}`)
    }
  
    loginWin.on('closed', () => {
      loginWin = null
      if (!isDevelopment && (win && !win.isVisible())) {
        app.quit()
      }
    })
  })
}

function createHomeWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    id: 'home',
    width: app.appConf.size.width,
    height: app.appConf.size.height,
    backgroundColor: '#fcfbf7',
    show: false,
    title: '添富云笔记',
    // frame: false,
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
    win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html#/home')
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
}

function createPreviewWindow (event, arg) {
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
    previewWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + `#/preview?note_id=${arg.noteId}&title=${arg.title}&isPdf=${arg.isPdf}`)
    // previewWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    previewWin.loadURL(`app://./index.html#/preview?note_id=${arg.noteId}&title=${arg.title}`)
  }

  previewWin.on('closed', () => {
    previewWin = null
    win && win.webContents.send('communicate', {
      from: 'Preview',
      tasks: ['pushData']
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

  if (win && !win.isVisible()) {
    win.show()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools()
  }
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  let dbPath = path.resolve(app.getAppPath('userData'), `../`)
  // let dbPath = '/Users/bowiego/Documents/workspace/enote/temp'
  let serviceUrl = isDevelopment
    // ? 'https://122.152.201.59:8000/api'
    ? 'https://iapp.htffund.com/note/api'
    : 'https://10.50.144.83:8000/api'
    // : 'https://iapp.htffund.com/note/api'
    // : 'http://10.50.115.9:8000/api'
    
  getAppConf(app.getAppPath('userData')).then(appConf => {
    if (!appConf.serviceUrl || appConf.serviceUrl === '') {
      saveAppConf(app.getAppPath('userData'), {
        serviceUrl: serviceUrl,
        appPath: dbPath
      })
    }
    let defaultSize = [960, 640]
    if (appConf.size) {
      defaultSize[0] = appConf.size.width || 960
      defaultSize[1] = appConf.size.height || 640
    }
    let p = dbPath + '/database'
    app.appConf = {
      user: appConf.user,
      dbPath: p,
      resourcePath: dbPath + '/resource',
      serviceUrl: appConf.serviceUrl || serviceUrl,
      note_ver: 1,
      dev_url: process.env.WEBPACK_DEV_SERVER_URL,
      size: {
        x: 0,
        y: 0,
        width: defaultSize[0],
        height: defaultSize[1]
      }
    }

    fs.mkdir(p, { recursive: true }, (err) => {
      createCollection('user', p)
      createLoginWindow(appConf.user)
      createHomeWindow()
    })
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
ipcMain.on('changeWindow', (event, arg) => {
  if (arg.name === 'home') {
    // loginWin && loginWin.close()
    createHomeWindow()
  }
  if (arg.name === 'login') {
    loginWin && loginWin.destroy()
    setTimeout(() => {
      win && win.destroy()
      createHomeWindow()
      createLoginWindow()
    }, 500)
  }
})

ipcMain.on('hideWindow', (event, arg) => {
})

ipcMain.on('showWindow', (event, arg) => {
})

ipcMain.on('login-ready', (event, arg) => {
  connectDatabase().then(() => {
    showHomeWindow()
  })
})

ipcMain.on('pull-finished', (event, arg) => {
  if (!isDevelopment) {
    loginWin && loginWin.hide()
  }
  showHomeWindow()
})

ipcMain.on('create-home-window', (event, arg) => {
  if (!isDevelopment) {
    loginWin && loginWin.hide()
  }
  createHomeWindow()
})

ipcMain.on('create-preview-window', (event, arg) => {
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
  taskId++
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

function connectDatabase () {
  return new Promise((resolve, reject) => {
    let p = app.appConf.dbPath + '/' + app.appConf.user
    fs.mkdir(p, { recursive: true }, (err) => {
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

function showHomeWindow () {
  win && win.show()
  win && win.webContents.send('login-ready')
  if (!isDevelopment) {
    loginWin && loginWin.destroy()
  } else {
    // createTestWindow()
  }
}

function beforeQuit () {
  let sizeInteger = win.getSize()
  saveAppConf(app.getAppPath('userData'), {
    size: {
      width: sizeInteger[0],
      height: sizeInteger[1]
    }
  })
}
