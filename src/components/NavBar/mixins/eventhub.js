export default {
  created () {
    this.$hub.hookHub('newNote', 'FileTool', () => this.handleNewNote(true))
    this.$hub.hookHub('newTemplateDoc', 'FileTool', () => this.handleNewTemplateDoc(true))
    this.$hub.hookHub('newNote', 'DocumentList', () => this.handleNewNote(true))
    this.$hub.hookHub('newFolder', 'FileTool', () => this.handleNewFolder(true))
    this.$hub.hookHub('goRecycle', 'FileCard', () => this.clickRecycleNode())
  }
}
