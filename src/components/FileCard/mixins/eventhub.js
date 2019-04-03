export default {
  created () {
    this.$hub.hookHub('renameFileCard', 'DocumentList', id => {
      if (this.viewFileType === 'recycle') return
      if (id === this.file_id) {
        this.showTitleInput = true
        this.$nextTick(() => {
          this.$refs.titleInput.select()
        })
      }
    })
    this.$hub.hookHub('deleteFileCard', 'DocumentList', id => {
      if (this.viewFileType === 'recycle') return
      if (id === this.file_id) {
        this.DELETE_FILE(id)
        this.$hub.dispatchHub('goRecycle', this)
      }
    })
  }
}
