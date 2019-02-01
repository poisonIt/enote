export default [
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
      callbackName: 'handleMove'
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
    label: '删除',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleDelete'
    }
  }
]
