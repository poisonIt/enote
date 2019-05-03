export default [
  {
    label: '置顶',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleStickTop'
    }
  },
  {
    label: '导出为PDF',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleExportPDF'
    }
  },
  // {
  //   label: '重命名',
  //   eventListener: {
  //     eventName: 'click',
  //     callbackName: 'handleRename'
  //   }
  // },
  // {
  //   label: '移动到',
  //   eventListener: {
  //     eventName: 'click',
  //     callbackName: 'handleMove'
  //   }
  // },
  {
    label: '复制笔记',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleDuplicate'
    }
  },
  {
    label: '删除笔记',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleRemove'
    }
  },
  {
    type: 'separator'
  },
  {
    label: '新窗口打开',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleNewWindow'
    }
  },
  {
    type: 'separator'
  },
  {
    label: '分享',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleShare'
    }
  },
  {
    label: '查看历史版本',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleHistory'
    }
  }
]
