import { ipcRenderer } from 'electron'
import { mapActions } from 'vuex'

export default {
  created () {
    this.$hub.hookHub('renameFileCard', 'DocumentList', id => {
      this.focusRenameById(id)
    })
  },

  methods: {
    ...mapActions([
      'SET_RENAME_FILE_ID'
    ]),

    focusRenameById (id) {
      if (this.viewFileType === 'recycle') return
      if (id === this.file_id) {
        this.SET_RENAME_FILE_ID('')
        this.showTitleInput = true
        this.$nextTick(() => {
          let titleInput = this.$refs.titleInput
          if (titleInput) {
            titleInput.focus()
            titleInput.select()
          }
        })
      }
    }
  }
}
