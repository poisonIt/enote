export default {
  created () {
    this.$hub.hookHub('newNote', 'FileTool', () => this.handleNewNote(true))
    // this.$hub.hookHub('newTemplateDoc', 'FileTool', () => this.handleNewTemplateDoc(true))
    this.$hub.hookHub('newNote', 'DocumentList', () => this.handleNewNote(false))
    this.$hub.hookHub('setCurrentFolder', 'DocumentList', (id) => this.setCurrentFolder(id))
    this.$hub.hookHub('navUp', 'DocumentList', () => this.handleNavUp())
    this.$hub.hookHub('newFolder', 'FileTool', () => this.handleNewFolder(true))
    // this.$hub.hookHub('goBin', 'FileCard', () => this.setCurrentFolder('bin'))
    this.$hub.hookHub('deleteNavNode', 'DocumentList', (id) => {
      this.$refs.tree.model.store.map[id].hidden = true
    })
    this.$hub.hookHub('addTagNode', 'TagHandler', (tag) => this.handleAddTagNode(tag))
    this.$hub.hookHub('updateFile', 'FileCard', (params) => this.handleFolderUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFolderUpdate(params))
  },

  methods: {
    handleNavUp () {
      this.$refs.tree.selectParent()
    }
  }
}
