'use strict'
import path from 'path'
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
// import { loadDB } from '../db'
import { readFile, writeFile } from './utils/file'
import { getAppConf } from './tools/appConf'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let backWin
let loginWin
let youdaoWin

let template = [{
  label: app.getName(),
  submenu: [{
    label: '退出',
    accelerator: 'CmdOrCtrl+Q',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        app.quit()
      }
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

function createLoginWindow () {
  loginWin = new BrowserWindow({
    id: 'login',
    width: isDevelopment ? 1024 : 442,
    height: 490,
    // frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__static, 'icon.png'),
    webPreferences: {
      webSecurity: false
    }
  })
  loginWin.setMinimumSize(442, 490)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    loginWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    loginWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    loginWin.loadURL('app://./index.html')
  }

  loginWin.on('closed', () => {
    loginWin = null
  })
}

function createBackgroundWindow () {
  backWin = new BrowserWindow({
    id: 'background',
    // show: false
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    backWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/background')
    backWin.webContents.openDevTools()
  } else {
    createProtocol('app')
    backWin.loadURL('app://./index.html#/background')
  }

  backWin.on('closed', () => {
    backWin = null
  })
}

function createHomeWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    id: 'home',
    width: isDevelopment ? 1366 : 960,
    height: 640,
    backgroundColor: '#fcfbf7',
    // frame: false,
    // titleBarStyle: 'hidden',
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
  }

  win.on('closed', () => {
    win = null
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

  // event.sender.send('youdao-reply', {
  //   url: url,
  //   winUrl: youdaoWin.getURL()
  // })

  youdaoWin.on('closed', () => {
    youdaoWin = null
  })
}

ipcMain.on('changeWindow', (event, arg) => {
  if (arg.name === 'home') {
    loginWin && loginWin.close()
    createHomeWindow()
  }
  if (arg.name === 'login') {
    win && win.close()
    createLoginWindow()
  }
})

ipcMain.on('createWindow', (event, arg) => {
  if (arg.name === 'youdao') {
    createYoudaoAsyncWindow(event, arg.url)
  }
})

ipcMain.on('userDB-ready', (event, arg) => {
  if (!loginWin) {
    createLoginWindow()
  }

  // event.sender.send('db-loaded')
})

ipcMain.on('login-ready', (event) => {
  getAppConf(app.getAppPath('userData')).then(appConf => {
    app.appConf.user = appConf.user
    backWin.webContents.send('login-ready')
  })
  // event.sender.send('db-loaded')
})

ipcMain.on('local-service-response', (event, arg) => {
  if (arg.to === 'login') {
    loginWin.webContents.send('local-service-response', arg.data)
  }
})

ipcMain.on('db-loaded', (event) => {
  win.webContents.send('db-loaded')
})

ipcMain.on('fetch-local-data', (event, arg) => {
  backWin.webContents.send('fetch-local-data', arg)
})

ipcMain.on('fetch-local-data-response', (event, arg) => {
  win.webContents.send('fetch-local-data-response', arg)
})

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

  if (win === null) {
    createLoginWindow()
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

  // app.database = {
  //   userDB: loadLinvoDB(path.resolve(app.getAppPath('userData'), '../database')),
  //   folderDB: {},
  //   noteDB: {},
  //   docDB: {},
  //   tagDB: {},
  //   picDB: {}
  // }

  // createCollection('user', app.database.userDB)

  let dataPath = app.getAppPath('userData')
  getAppConf(app.getAppPath('userData')).then(appConf => {
    app.appConf = {
      user: appConf.user,
      dbPath: path.resolve(dataPath, `../database`),
    }
    createBackgroundWindow()
    // if (appConf.user) {
    //   app.database.userDB.findOne({ _id: appConf.user }, (err, user) => {
    //     if (err) {
    //       createLoginWindow()
    //     } else {
    //       if (user) {
    //         createHomeWindow()
    //       } else {
    //         createLoginWindow()
    //       }
    //     }
    //   })
    // } else {
    //   createLoginWindow()
    // }
  })
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

