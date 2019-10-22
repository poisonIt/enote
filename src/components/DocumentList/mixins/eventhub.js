import * as _ from 'lodash'
import fetchLocal from '../../../utils/fetchLocal'

export default {
  created () {
    this.$hub.hookHub('addFile', 'NavBar', (file) => this.handleFileAdded(file))
    this.$hub.hookHub('renameListFile', 'NavBar', (file) => this.handleFileRename(file))
    this.$hub.hookHub('setSelectFileId', 'NavBar', (selectId) => this.selectedIdCache = selectId)
    this.$hub.hookHub('refreshList', 'NavBar', () => this.refreshList())
    this.$hub.hookHub('renameListFile', 'FileCard', (file) => this.handleFileRename(file))
    this.$hub.hookHub('updateFile', 'FileCard', (params) => this.handleFileUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFileUpdate(params))
    this.$hub.hookHub('removeFile', 'FileHandler', (file) => this.handleFileRemove(file))
    this.$hub.hookHub('refreshList', 'TagHandler', () => this.refreshList())
    this.$hub.hookHub('updateDoc', 'Editor', (file) => this.handleDocUpdate(file))
    this.$hub.hookHub('updateFileProperty', 'SharePanel', (params) => this.handleFileValUpdate(params))
  },

  methods: {
    handleFileAdded (file) {
      this.noteList.unshift(file)
      this.selectedIdCache = file._id
      this.refreshList()
    },

    handleFileRename (file) {
      let f = _.find(this.fileList, { _id: file.id })
      if (f) {
        f.title = file.title
      }
    },

    handleDocUpdate (file) {
      let f = _.find(this.fileList, { _id: file.id })
      if (f) {
        this.$set(f, 'summary', file.summary)
      }
    },

    handleFileValUpdate (params) {
      let f = _.find(this.fileList, { _id: params.id })
      if (f) {
        Object.keys(params).forEach(key => {
          if (key !== 'id' && f.hasOwnProperty(key)) {
            this.$set(f, key, params[key])
          }
        })
      }
    },

    handleFileUpdate (params) {
      if (!this.currentFile) return
      this.$nextTick(() => {
        let taskName = this.currentFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
        fetchLocal(taskName, {
          id: this.currentFile._id,
          title: params.name
        }).then(res => {
          this.selectedIdCache = res._id
          this.refreshList()
          this.$hub.dispatchHub('pushData', this)
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
        this.$hub.dispatchHub('pushData', this)
      })
    },

    navUpHub () {
      this.$hub.dispatchHub('navUp', this)
    }
  }
}
