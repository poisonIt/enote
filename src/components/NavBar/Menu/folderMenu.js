const folderMenu = [
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
  }
  // {
  //   label: '上传',
  //   eventListener: {
  //     eventName: 'click',
  //     callbackName: 'handleUpload'
  //   }
  // }
]

export default folderMenu
