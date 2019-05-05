export default {
  created () {
    this.$hub.hookHub('pushData', 'NavBar', () => {
      this.syncData(1000, true)
    })
    this.$hub.hookHub('pushData', 'DocumentList', () => {
      this.syncData(1000, true)
    })
    this.$hub.hookHub('pushData', 'TagHandler', () => {
      this.syncData(1000, true)
    })
    this.$hub.hookHub('pushData', 'FileHandler', () => {
      this.syncData(1000, true)
    })
  }
}
