export default {
  created () {
    this.$hub.hookHub('clickNavMini', 'NavBar', link => {
      if (this.node.data.link === link) {
        this.node.store.instance.$parent.handleItemClick(this.node)
      }
    })
    this.$hub.hookHub('clickFolder', 'DocumentList', id => {
      if (this.node.data.id === id) {
        this.expandAncestor()
        this.node.store.instance.$parent.handleItemClick(this.node)
      }
    })
  }
}
