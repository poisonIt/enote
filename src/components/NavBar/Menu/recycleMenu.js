const recycleMenu = [
  {
    label: '清空回收站',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleClearRecycle'
    }
  },
  {
    label: '全部恢复',
    eventListener: {
      eventName: 'click',
      callbackName: 'handleResumeRecycle'
    }
  }
]

export default recycleMenu
