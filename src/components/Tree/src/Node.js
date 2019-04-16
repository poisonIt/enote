import objectAssign from '../../../utils/merge'

let nid = 0

export default class Node {
  constructor (options) {
    this.uid = nid++
    this.text = null
    this.data = null
    this.expanded = false
    this.parent = null
    this.visible = true
    this.selected = false

    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }

    // internal
    this.level = 0
    this.childNodes = []
    if (this.parent) {
      this.level = this.parent.level + 1
    }

    const store = this.store
    this.setData(this.data)
    if (store.defaultExpandAll) {
      this.expanded = true
    }
    store.nodeMap[this.uid] = this
  }

  setData (data) {
    this.data = data
    this.childNodes = []

    let children
    if (this.level === 0 && this.data instanceof Array) {
      children = this.data
    } else {
      children = this.data.children || []
    }

    for (let i = 0, len = children.length; i < len; i++) {
      if (children[i].trash && children[i].trash !== 'NORMAL') continue
      this.insertChild({
        data: children[i]
      })
    }
  }

  insertChild (child) {
    if (!child) throw new Error('insertChild error: child is required.')

    if (!(child instanceof Node)) {
      const children = this.getChildren()
      if (children.indexOf(child.data) === -1) {
        children.push(child.data)
      }
      objectAssign(child, {
        parent: this,
        store: this.store
      })

      child = new Node(child)
    }
    child.level = this.level + 1
    this.childNodes.push(child)
    return child
  }

  getChildren () {
    if (this.level === 0) return this.data
    const data = this.data
    if (!data) return null
    if (data.children === undefined) {
      data.children = null
    }
    return data.children
  }

  getAncestors () {
    let result = [this]
    function addAncestor (node, arr) {
      if (node.parent) {
        arr.unshift(node.parent)
        addAncestor(node.parent, arr)
      }
    }
    addAncestor(this, result)
    return result
  }

  collapse () {
    this.expanded = false
  }

  expand () {
    this.expanded = true
  }

  delete () {
    const index = this.parent.data.children.indexOf(this.data)
    this.parent.data.children.splice(index, 1)
    this.parent.childNodes.splice(index, 1)
  }

  get label () {
    return this.data.label || this.data[this.store.labelProxy]
  }
}
