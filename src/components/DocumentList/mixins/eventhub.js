import * as _ from 'lodash'
import fetchLocal from '../../../utils/fetchLocal'

export default {
  created () {
    this.$hub.hookHub('addFile', 'NavBar', (file) => this.handleFileAdded(file))
    this.$hub.hookHub('renameListFile', 'NavBar', (file) => this.handleFileRename(file))
    this.$hub.hookHub('refreshList', 'NavBar', () => this.refreshList())
    this.$hub.hookHub('renameListFile', 'FileCard', (file) => this.handleFileRename(file))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFileUpdate(params))
    this.$hub.hookHub('removeFile', 'FileHandler', (file) => this.handleFileRemove(file))
  },

  methods: {
    handleFileAdded (file) {
      console.log('handleFileAdded', file)
      this.noteList.unshift(file)
      this.selectedIdCache = file._id
      this.updateFileList()
    },

    handleFileRename (file) {
      let f = _.find(this.fileList, { _id: file.id })
      if (f) {
        f.title = file.title
      }
    },

    handleFileUpdate (params) {
      this.$nextTick(() => {
        let taskName = this.currentFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
        fetchLocal(taskName, {
          id: this.currentFile._id,
          title: params.name
        }).then(res => {
          let file = _.find(this.fileList, { _id: res._id })
          let idx = this.fileList.indexOf(file)
          file.title = res.title
          this.$set(this.fileList, idx, file)
        })
      })
    },

    handleFileRemove (file) {
      const { id } = file
      fetchLocal('updateLocalNote', {
        id: id,
        trash: 'TRASH'
      }).then(res => {
        this.refreshList()
      })
    },

    navUpHub () {
      this.$hub.dispatchHub('navUp', this)
    }
  }
}
