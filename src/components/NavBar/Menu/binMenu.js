const binMenu = [
  {
    label: '清空回收站',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleClearBin'
    }
  },
  {
    label: '全部恢复',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleResumeBin'
    }
  }
]

export default binMenu
