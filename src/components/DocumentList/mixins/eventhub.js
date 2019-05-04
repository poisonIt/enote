import * as _ from 'lodash'

export default {
  created () {
    this.$hub.hookHub('addFile', 'NavBar', (file) => this.handleFileAdded(file))
    this.$hub.hookHub('renameListFile', 'NavBar', (file) => this.handleFileRename(file))
    this.$hub.hookHub('updateFile', 'FileCard', (params) => this.handleFileUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFileUpdate(params))
  },

  methods: {
    handleFileAdded (file) {
      this.fileList.unshift(file)
      this.selectFile(0)
    },

    handleFileRename (file) {
      let f = _.find(this.fileList, { _id: file.id })
      if (f) {
        f.title = file.title
      }
    },

    handleFileUpdate (params) {
      if (params.id === this.currentFile._id) {
        this.UPDATE_CURRENT_FILE({
          title: params.name
        })
      } else {
        let file = _.find(this.list, { _id: params.id })
        let idx = this.list.indexOf(file)
        if (params.name) {
          file.title = params.name
        }
        this.$set(this.list, idx, file)
      }
    },

    navUpHub () {
      this.$hub.dispatchHub('navUp', this)
    }
  }
}
