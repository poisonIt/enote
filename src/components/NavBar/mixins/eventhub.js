export default {
  created () {
    this.$hub.hookHub('newDoc', 'FileTool', () => this.handleNewDoc(true))
    this.$hub.hookHub('newTemplateDoc', 'FileTool', () => this.handleNewTemplateDoc(true))
    this.$hub.hookHub('newDoc', 'DocumentList', () => this.handleNewDoc(true))
    this.$hub.hookHub('newFolder', 'FileTool', () => this.handleNewFolder(true))
    this.$hub.hookHub('goRecycle', 'FileCard', () => this.clickRecycleNode())
  }
}
