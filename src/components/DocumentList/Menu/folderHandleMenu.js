export default [
  {
    label: '新建',
    submenu: [
      {
        label: '新建笔记',
        eventListener: {
          eventName: 'click',
          callbackName: 'handleNewNote'
        }
      },
      // {
      //   label: '新建模板笔记',
      //   eventListener: {
      //     eventName: 'click',
      //     callbackName: 'handleNewTemplateNote'
      //   }
      // },
      {
        label: '新建文件夹',
        eventListener: {
          eventName: 'click',
          callbackName: 'handleNewFolder'
        }
      }
    ]
  },
  {
    label: '移动',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleMove'
    }
  },
  {
    label: '重命名',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleRename'
    }
  },
  {
    label: '删除',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleRemove'
    }
  }
]
