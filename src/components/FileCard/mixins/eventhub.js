import { ipcRenderer } from 'electron'

export default {
  created () {
    this.$hub.hookHub('renameFileCard', 'DocumentList', id => {
      if (this.viewFileType === 'recycle') return
      if (id === this.file_id) {
        this.showTitleInput = true
        this.$nextTick(() => {
          this.$refs.titleInput && this.$refs.titleInput.select()
        })
      }
    })
  }
}
