export default {
  created () {
    this.$hub.hookHub('pushData', 'NavBar', () => {
      this.pushLocalData(1000, true)
    })
    this.$hub.hookHub('pushData', 'DocumentList', () => {
      this.pushLocalData(1000, true)
    })
    this.$hub.hookHub('pushData', 'TagHandler', () => {
      this.pushLocalData(1000, true)
    })
    this.$hub.hookHub('pushData', 'FileHandler', () => {
      this.pushLocalData(1000, true)
    })
    this.$hub.hookHub('pushData', 'Editor', () => {
      this.pushLocalData(1000, true)
    })
  }
}
