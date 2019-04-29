const TreeNode = function (opts, store) {
  const { id, isLeaf } = opts
  this.id = (typeof id === 'undefined') ? new Date().valueOf() : id
  this.parent = null
  this.children = null
  this.isLeaf = !!isLeaf
  this.store = store

  // other params
  for (var k in opts) {
    if (k !== 'id' && k !== 'children' && k !== 'isLeaf') {
      this[k] = opts[k]
    }
  }
}

TreeNode.prototype.changeName = function (name) {
  this.name = name
}

TreeNode.prototype.addChildren = function (children) {
  if (!children.children) {
    children.children = []
  }
  if (!this.children) {
    this.children = []
  }

  if (Array.isArray(children)) {
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i]
      child.parent = this
      child.pid = this.id
    }
    this.children.concat(children)
  } else {
    const child = children
    child.parent = this
    child.pid = this.id
    this.children.push(child)
  }
}

// remove self
TreeNode.prototype.remove = function () {
  const parent = this.parent
  const index = parent.findChildIndex(this)
  parent.children.splice(index, 1)
}

// remove child
TreeNode.prototype._removeChild = function (child) {
  for (var i = 0, len = this.children.length; i < len; i++) {
    if (this.children[i] === child) {
      this.children.splice(i, 1)
      break
    }
  }
}

TreeNode.prototype.isTargetChild = function (target) {
  let parent = target.parent
  while (parent) {
    if (parent === this) {
      return true
    }
    parent = parent.parent
  }
  return false
}

TreeNode.prototype.moveInto = function (target) {
  if (this.name === 'root' || this === target) {
    return
  }

  // cannot move ancestor to child
  if (this.isTargetChild(target)) {
    return
  }

  // cannot move to leaf node
  if (target.isLeaf) {
    return
  }

  this.parent._removeChild(this)
  this.parent = target
  this.pid = target.id
  if (!target.children) {
    target.children = []
  }
  target.children.unshift(this)
}

TreeNode.prototype.findChildIndex = function (child) {
  var index
  for (let i = 0, len = this.children.length; i < len; i++) {
    if (this.children[i] === child) {
      index = i
      break
    }
  }
  return index
}

TreeNode.prototype._beforeInsert = function (target) {
  if (this.name === 'root' || this === target) {
    return false
  }

  // cannot move ancestor to child
  if (this.isTargetChild(target)) {
    return false
  }

  this.parent._removeChild(this)
  this.parent = target.parent
  this.pid = target.parent.id
  return true
}

TreeNode.prototype.insertBefore = function (target) {
  if (!this._beforeInsert(target)) return

  const pos = target.parent.findChildIndex(target)
  target.parent.children.splice(pos, 0, this)
}

TreeNode.prototype.insertAfter = function (target) {
  if (!this._beforeInsert(target)) return

  const pos = target.parent.findChildIndex(target)
  target.parent.children.splice(pos + 1, 0, this)
}

export default TreeNode
