import * as _ from 'lodash'

export default {
  created () {
    this.$hub.hookHub('addFile', 'NavBar', (file) => this.handleFileAdded(file))
    this.$hub.hookHub('updateFile', 'FileCard', (params) => this.handleFileUpdate(params))
    this.$hub.hookHub('updateFile', 'FileHandler', (params) => this.handleFileUpdate(params))
  },

  methods: {
    handleFileAdded (file) {
      this.list.push(file)
      this.selectFile(this.list.indexOf(file))
    },

    handleFileUpdate (params) {
      let file = _.find(this.list, { _id: params.id })
      let idx = this.list.indexOf(file)
      if (params.name) {
        file.title = params.name
      }
      this.$set(this.list, idx, file)
    },

    clickFolderHub (id) {
      this.$hub.dispatchHub('clickFolder', this, id)
    },

    navUpHub () {
      this.$hub.dispatchHub('navUp', this)
    }
  }
}
