const resourceMenu1 = [
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
  // {
  //   label: '复制',
  //   eventListener: {
  //     eventName: 'click',
  //     callbackName: 'handleDuplicate'
  //   }
  // },
  {
    label: '删除',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleDelete'
    }
  }
]

const resourceMenu2 = [
  {
    type: 'separator'
  },
  {
    label: '重命名',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleRename'
    }
  },
  {
    label: '移动到',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleRemove'
    }
  },
  {
    label: '复制',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleDuplicate'
    }
  },
  {
    label: '粘贴',
    eventListener: {
      eventName: 'click',
      callbackName: 'handlePaste'
    }
  },
  {
    label: '删除',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleDelete'
    }
  }
]

const resourceMenu = [
  resourceMenu1,
  resourceMenu2
]

export default resourceMenu
