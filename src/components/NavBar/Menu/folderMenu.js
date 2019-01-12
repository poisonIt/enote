const folderMenu = [
  {
    label: '新建',
    submenu: [
      {
        label: '笔记',
        eventListener: {
          eventName: 'click',
          callbackName: 'handleNewDoc'
        }
      },
      {
        label: '文件夹',
        eventListener: {
          eventName: 'click',
          callbackName: 'handleNewFolder'
        }
      }
    ]
  },
  {
    label: '上传',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleUpload'
    }
  }
]

export default folderMenu
