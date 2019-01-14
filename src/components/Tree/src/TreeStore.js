import Node from './Node'

export default class TreeStore {
  constructor (options) {
    this.currentNode = null
    this.currentNodeKey = null

    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }

    this.nodeMap = {}
    this.root = new Node({
      data: this.data,
      store: this
    })
  }

  setData (newVal) {
    this.nodeMap = {}
    this.root.setData(newVal)
  }

  setCurrentNode (node) {
    this.currentNode = node
  }
}