import TreeNode from './TreeNode'

function TreeStore (opts) {
  this.map = {}
  this.root = new TreeNode({ name: 'root', isLeaf: false, id: 0 }, this)
  this.initNode(this.root, opts)
  this.currentNode = null
  return this.root
}

TreeStore.prototype.initNode = function (node, opts) {
  for (let i = 0, len = opts.length; i < len; i++) {
    var _opts = opts[i]

    var child = new TreeNode(_opts, this)
    if (_opts.children && _opts.children.length > 0) {
      this.initNode(child, _opts.children)
    }
    node.addChildren(child)
  }
}

TreeStore.prototype.setCurrentNode = function (node, root, instance) {
  if (this.currentNode === node) return
  if (instance && !node.instance) {
    node.instance = instance
  }
  this.currentNode = node
  root.$emit('set-current', node)
}

TreeStore.prototype.getNodeById = function (id) {
  return this.map[id]
}

export default TreeStore
