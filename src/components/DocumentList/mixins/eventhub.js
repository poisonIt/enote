export default {
  methods: {
    clickFolderHub (id) {
      this.$hub.dispatchHub('clickFolder', this, id)
    },

    navUpHub () {
      this.$hub.dispatchHub('navUp', this)
    }
  }
}
