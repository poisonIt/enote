'use strict'
import path from 'path'
import fs from 'fs'
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
let backWin
let loginWin
let previewWin
let youdaoWin

let taskId = 0

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

function prepareCreateLogin (user) {
  return new Promise((resolve, reject) => {
    let autoLogin = '0'
    let data = {
      username: '',
      password: ''
    }
    if (user && user !== 'null') {
      LocalService.getLocalUserById({ id: user }).then(res => {
        console.log('getLocalUserById', user, res)
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
    if (win) win.destroy()
    console.log('createLoginWindow', user, autoLogin, data)
  
    loginWin = new BrowserWindow({
      id: 'login',
      width: isDevelopment ? 1024 : 442,
      height: 490,
      // frame: false,
      resizable: isDevelopment ? true : false,
      show: isDevelopment,
      titleBarStyle: 'hidden',
      icon: path.join(__static, 'icon.png'),
      parent: backWin,
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
      if (!isDevelopment && !win) {
        app.quit()
      }
    })
  })

}

// function createBackgroundWindow () {
//   backWin = new BrowserWindow({
//     id: 'background',
//     width: isDevelopment ? 1366 : 960,
//     height: 640,
//     backgroundColor: '#fcfbf7',
//     show: isDevelopment,
//     titleBarStyle: isDevelopment ? 'default' : 'hidden',
//     // show: false
//   })

//   if (process.env.WEBPACK_DEV_SERVER_URL) {
//     // Load the url of the dev server if in development mode
//     backWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/background')
//     backWin.webContents.openDevTools()
//   } else {
//     createProtocol('app')
//     backWin.loadURL('app://./index.html#/background')
//   }

//   backWin.on('closed', () => {
//     app.quit()
//   })
// }

function createHomeWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    id: 'home',
    width: app.appConf.size.width,
    height: app.appConf.size.height,
    backgroundColor: '#fcfbf7',
    show: true,
    title: '添富云笔记',
    // frame: false,
    titleBarStyle: isDevelopment ? 'default' : 'hidden',
    icon: path.join(__static, 'icon.png'),
    parent: backWin,
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

  win.on('show', (event) => {
    win.focus()
  })

  win.on('close', (event) => {
    let sizeInteger = win.getSize()
    saveAppConf(app.getAppPath('userData'), {
      size: {
        width: sizeInteger[0],
        height: sizeInteger[1]
      }
    })
  })

  win.on('closed', (event) => {
    win = null
  })
}

function createPreviewWindow (event, arg) {
  previewWin = new BrowserWindow({
    id: 'preview',
    width: 960,
    height: 640,
    title: '笔记预览',
    backgroundColor: '#fcfbf7',
    titleBarStyle: 'hidden',
    webPreferences: {
      webSecurity: false
    }
  })
  previewWin.setMinimumSize(640, 640)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    previewWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL + `#/preview?note_id=${arg.noteId}&title=${arg.title}`)
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

  // if (win && !win.isVisible()) {
  //   win.show()
  //   backWin.show()
  // }
  // if (backWin === null) {
  //   createBackgroundWindow()
  // }
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
  let serviceUrl = isDevelopment
    ? 'http://122.152.201.59:8000/api'
    : 'http://10.50.115.9:8000/api'
  getAppConf(app.getAppPath('userData')).then(appConf => {
    if (!appConf.serviceUrl || appConf.serviceUrl === '') {
      saveAppConf(app.getAppPath('userData'), {
        serviceUrl: serviceUrl,
        appPath: app.getAppPath('userData')
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
      serviceUrl: serviceUrl,
      note_ver: 1,
      size: {
        x: 0,
        y: 0,
        width: defaultSize[0],
        height: defaultSize[1]
      }
    }

    fs.mkdir(p, { recursive: true }, (err) => {
      if (err) {
        dialog.showErrorBox('err', err)
      }
      createCollection('user', p)
      createLoginWindow(appConf.user)
    })
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
      backWin && backWin.reload()
      createLoginWindow()
    }, 1000)
  }
})

ipcMain.on('hideWindow', (event, arg) => {
  if (arg.name === 'background') {
    backWin && backWin.hide()
  }
})

ipcMain.on('showWindow', (event, arg) => {
  if (arg.name === 'background') {
    backWin && backWin.show()
  }
})

ipcMain.on('create-home-window', (event, arg) => {
  // backWin && backWin.show()
  if (!isDevelopment) {
    loginWin && loginWin.hide()
  }
  createHomeWindow()
})

ipcMain.on('home-window-ready', (event) => {
  LocalService.getAllLocalFolder().then(res1 => {
    LocalService.getAllLocalTag().then(res2 => {
      sendLocalDataRes({
        tasks: ['getAllLocalFolder', 'getAllLocalTag'],
        res: [res1, res2],
        from: ['NavBar']
      })
    })
  })
  // backWin.webContents.send('home-window-ready')
})

ipcMain.on('show-home-window', (event, arg) => {
  // backWin && backWin.show()
  win && win.show()
  if (backWin && !isDevelopment) {
    backWin.setIgnoreMouseEvents(true)
    backWin.setOpacity(0)
    // backWin.hide()
    // backWin.setVisibleOnAllWorkspaces(true)
  }
  if (!isDevelopment) {
    loginWin && loginWin.destroy()
  }
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
    let p = app.appConf.dbPath + '/' + res._id
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
        console.log('appConf', app.appConf)
        setTimeout(() => {
          loginWin.webContents.send('update-user-data-response', res)
        }, 3000)
      })
    })
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

ipcMain.on('fetch-local-data', (event, arg) => {
  taskId++
  let tasks = arg.tasks.map((item, index) => {
    if (arg.params) {
      return LocalService[item](arg.params[index])
    } else {
      return LocalService[item]()
    }
  })
  execPromise(taskId, tasks, arg)  
})

ipcMain.on('communicate', (event, arg) => {
  win && win.webContents.send('communicate', arg)
})

function sendLocalDataRes (arg) {
  if (arg.from === 'Preview') {
    previewWin && previewWin.webContents.send('fetch-local-data-response', arg)
    return
  }
  win && win.webContents.send('fetch-local-data-response', arg)
  loginWin && loginWin.webContents.send('fetch-local-data-response', arg)
}

function execPromise (id, tasks, arg) {
  let tid = id
  if (arg.queue) {
    LocalService[arg.tasks[0]](arg.params[0]).then((res0) => {
      LocalService[arg.tasks[1]](arg.params[1]).then((res1) => {
        sendLocalDataRes({
          res: [res0, res1],
          from: arg.from,
          queue: true,
          tasks: arg.tasks
        })
      })
    })
  } else {
    Promise.all(tasks).then(res => {
      if (tid === taskId) {
        sendLocalDataRes({
          res: res,
          from: arg.from,
          tasks: arg.tasks
        })
      }
    })
  }
}
