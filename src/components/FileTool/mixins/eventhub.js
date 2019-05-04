export default {
  created () {
    this.$hub.hookHub('pushData', 'NavBar', () => {
      this.asyncData(1000, true)
    })
    this.$hub.hookHub('pushData', 'DocumentList', () => {
      this.asyncData(1000, true)
    })
    this.$hub.hookHub('pushData', 'TagHandler', () => {
      this.asyncData(1000, true)
    })
    this.$hub.hookHub('pushData', 'FileHandler', () => {
      this.asyncData(1000, true)
    })
  }
}
