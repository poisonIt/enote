import TreeNode from './TreeNode'

function TreeStore (opts) {
  this.root = new TreeNode({ name: 'root', isLeaf: false, id: 0 }, this)
  this.initNode(this.root, opts)
  return this.root
}

TreeStore.prototype.initNode = function (node, opts) {
  for (let i = 0, len = opts.length; i < len; i++) {
    var _opts = opts[i]

    var child = new TreeNode(_opts, this)
    if (_opts.children && _opts.children.length > 0) {
      this.initNode(child, _opts.children)
    }
    this.currentNode = child
    node.addChildren(child)
  }
}

TreeStore.prototype.setCurrentNode = function (node, root) {
  if (this.currentNode === node) return
  this.currentNode = node
  root.$emit('set-current', node)
}

export default TreeStore
