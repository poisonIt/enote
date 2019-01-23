import Node from './Node'

// function cloneShallow (target) {
//   let result = {}
//   for (let name in target) {
//     console.log(name)
//     if (name !== '__ob__') {
//       result[name] = target[name]
//     }
//   }
//   return result
// }

export default class TreeStore {
  constructor (options) {
    this.currentNode = null
    this.currentNodeKey = null

    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }
    console.log(this.data)

    this.nodeMap = {}
    this.root = new Node({
      data: this.data,
      store: this
    })
    console.log(this.root)
  }

  setData (newVal) {
    this.nodeMap = {}
    this.root.setData(newVal)
  }

  setCurrentNode (node) {
    this.currentNode = node
  }
}
