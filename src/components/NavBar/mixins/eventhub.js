export default {
  created () {
    this.$hub.hookHub('newNote', 'FileTool', () => this.handleNewNote(true))
    this.$hub.hookHub('newTemplateDoc', 'FileTool', () => this.handleNewTemplateDoc(true))
    this.$hub.hookHub('newNote', 'DocumentList', () => this.handleNewNote(true))
    this.$hub.hookHub('setCurrentFolder', 'DocumentList', (id) => this.setCurrentFolder(id))
    this.$hub.hookHub('navUp', 'DocumentList', () => this.handleNavUp())
    this.$hub.hookHub('newFolder', 'FileTool', () => this.handleNewFolder(true))
    this.$hub.hookHub('goRecycle', 'FileCard', () => this.clickRecycleNode())
    this.$hub.hookHub('updateFile', 'FileCard', (params) => this.handleFolderUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFolderUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFolderUpdate(params))
  },

  methods: {
    handleNavUp () {
      this.$refs.tree.selectParent()
    }
  }
}
