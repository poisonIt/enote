export default {
  created () {
    this.$hub.hookHub('initEditor', 'DocumentList', id => {
      this.saveData()
      this.editor.destroy()
      // setTimeout(() => {
      this.initEditor()
      // }, 1000)
    })
    this.$hub.hookHub('destoryEditor', 'DocumentList', id => {
      console.log('destoryEditor')
    })
  }
}
