import {
  app,
  BrowserWindow
} from 'electron'
import {
  appQuit,
  logout
} from '../background'

const productName = require('../../vue.config.js').pluginOptions.electronBuilder.builderOptions.productName

const applicationMenuTemplate = [{
  label: productName,
  submenu: [
    {
      label: '注销',
      click: (item, focusedWindow) => {
        logout()
      }
    },
    {
      label: '退出',
      accelerator: 'CmdOrCtrl+Q',
      click: (item, focusedWindow) => {
        appQuit()
      }
    }
  ]
},
// {
//   label: '编辑',
//   submenu: [{
//     label: '撤销',
//     accelerator: 'CmdOrCtrl+Z',
//     role: 'undo'
//   }, {
//     label: '重做',
//     accelerator: 'Shift+CmdOrCtrl+Z',
//     role: 'redo'
//   }, {
//     type: 'separator'
//   }, {
//     label: '剪切',
//     accelerator: 'CmdOrCtrl+X',
//     role: 'cut'
//   }, {
//     label: '复制',
//     accelerator: 'CmdOrCtrl+C',
//     role: 'copy'
//   }, {
//     label: '粘贴',
//     accelerator: 'CmdOrCtrl+V',
//     role: 'paste'
//   }, {
//     label: '全选',
//     accelerator: 'CmdOrCtrl+A',
//     role: 'selectall'
//   }]
// },
{
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
    label: '指南',
    click: () => {
    }
  }]
}]

const contextMenuTemplate = [
  {
    label: '最小化',
    click: (item, focusedWindow) => {
      BrowserWindow.getAllWindows().forEach(win => {
        win.minimize()
      })
    }
  },
  {
    label: '最大化',
    click: (item, focusedWindow) => {
      BrowserWindow.getAllWindows().forEach(win => {
        win.maximize()
      })
    }
  },
  {
    label: '还原窗口',
    click: (item, focusedWindow) => {
      BrowserWindow.getAllWindows().forEach(win => {
        win.restore()
      })
    }
  },
  {
    type: 'separator'
  },
  {
    label: '切换开发者工具',
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: (item, focusedWindow) => {
      BrowserWindow.getAllWindows().forEach(win => {
        win.toggleDevTools()
      })
    }
  },
  {
    type: 'separator'
  },
  {
    label: '注销',
    click: (item, focusedWindow) => {
      logout()
    }
  },
  {
    label: '退出',
    click: (item, focusedWindow) => {
      appQuit()
    }
  }
]

export {
  applicationMenuTemplate,
  contextMenuTemplate
}
