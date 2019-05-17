import * as _ from 'lodash'
import { ipcRenderer } from 'electron'

export default {
  created () {
    this.$hub.hookHub('addFile', 'NavBar', (file) => this.handleFileAdded(file))
    this.$hub.hookHub('renameListFile', 'NavBar', (file) => this.handleFileRename(file))
    this.$hub.hookHub('updateFile', 'FileCard', (params) => this.handleFileUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFileUpdate(params))
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
        let file = _.find(this.fileList, { _id: params.id })
        console.log('handleFileUpdate', params, file, this.fileList)
        let idx = this.fileList.indexOf(file)
        if (params.name) {
          file.title = params.name
        }
        this.$set(this.fileList, idx, file)
  
        let taskName = this.currentFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
        ipcRenderer.send('fetch-local-data', {
          tasks: [taskName],
          params: [{
            id: this.currentFile._id,
            title: params.name
          }],
          from: ['DocumentList', 'handleFileUpdate', this.currentFile._id]
        })
        this.$hub.dispatchHub('pushData', this)
      })
    },

    navUpHub () {
      this.$hub.dispatchHub('navUp', this)
    }
  }
}
