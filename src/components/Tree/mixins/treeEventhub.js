export default {
  created () {
    this.$hub.hookHub('navUp', 'DocumentList', () => {
      const parentInstance = this.store.currentNode.parent.instance
      if (parentInstance) {
        const rootParent = this.store.instance.$parent
        rootParent.handleItemClick(parentInstance.node)
      }
    })
  }
}
