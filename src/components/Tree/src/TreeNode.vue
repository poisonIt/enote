<template>
  <div class="tree-node"
    :class="{
      'is-expanded' : expanded,
      'is-selected' : tree.store.currentNode === node
    }"
    v-show="node.visible">
    <div class="tree-node__content"
      :style="{ paddingLeft: node.level * 20 - 10 + 'px', height: 'auto' }">
      <div class="icon icon-arrow"
        :class="{
          'transparent' : node.childNodes.length === 0,
          'is-expanded' : expanded
        }"
        @click="handleExpand">
      </div>
      <!-- <i
        class="fa fa-caret-right icon-right"
        :class="{
          'transparent' : node.childNodes.length === 0,
          'is-expanded' : expanded
        }"
        :style="{ lineHeight: itemHeight }"
        aria-hidden="true">
      </i> -->
      <!-- <input type="checkbox"> -->
      <node-content :node="node"></node-content>
    </div>
    <!-- <collapse-transition> -->
      <div class="tree-node_children" v-show="expanded">
        <tree-node
          v-for="child in node.childNodes"
          :key="child.uid"
          :node="child">
        </tree-node>
      </div>
    <!-- </collapse-transition> -->
  </div>
</template>

<script>
export default {
  name: 'TreeNode',

  components: {
    NodeContent: {
      props: {
        node: {
          required: true
        }
      },
      render (h) {
        const parent = this.$parent
        const tree = parent.tree
        const node = this.node
        const { data, store } = node
        return (
          parent.renderContent
            ? parent.renderContent.call(
              parent._renderProxy,
              h,
              { _self: tree.$vnode.context, node, data, store }
            )
            : tree.$scopedSlots.default
              ? tree.$scopedSlots.default({ node, data })
              : <span class="el-tree-node__label">{ node.label }</span>
        )
      }
    }
  },

  data () {
    return {
      expanded: false
    }
  },

  props: {
    node: {
      default () {
        return {}
      }
    },

    renderContent: Function
  },

  computed: {
    itemHeight () {
      return this.tree.store.itemHeight
    }
  },

  watch: {
    'node.expanded' (val) {
      this.$nextTick(() => {
        this.expanded = val
      })
    }
  },

  created () {
    const parent = this.$parent
    if (parent.isTree) {
      this.tree = parent
    } else {
      this.tree = parent.tree
    }

    const tree = this.tree
    if (!tree) {
      console.warn('Can not find node\'s tree.')
    }

    // console.log('props', props)
    // const props = tree.props || {}
    // const chilrenKey = props['children'] || 'children'

    if (this.node.expanded) {
      this.expanded = true
    }
    this.node.instance = this
    if (this.node.level === 1 && this.node.parent.childNodes.indexOf(this.node) === 0) {
      this.handleClick()
    }
    this.$hub.$on('clickNavMini', (link) => {
      if (this.node.data.link === link) {
        this.$parent.$parent && this.$parent.$parent.handleItemClick(this.node)
      }
    })
  },

  methods: {
    handleClick () {
      const store = this.tree.store
      this.tree.store.expandOnClickNode && this.handleExpand()
      store.setCurrentNode(this.node)
    },

    handleExpand () {
      if (this.expanded) {
        this.node.collapse()
      } else {
        this.node.expand()
      }
    },

    insertChild (childData) {
      console.log('insertChild', this.node)
      if (!this.node.data.children) {
        this.$set(this.node.data, 'children', [])
      }
      const newChildNode = this.node.insertChild({
        data: childData
      })
      this.node.store.instance.$emit('insertChildNode', newChildNode)
    }
  }
}
</script>

<style lang="stylus" scoped>
.tree-node
  &.is-selected
    background-color #d8dadc
    & .tree-node
      background-color #fff
.tree-node__content
  position relative
  height 26px
  display -webkit-box
  -webkit-box-orient horizontal
  -webkit-box-direction normal
  -webkit-box-align center
  -webkit-box-flex 0
  // flex-direction row
  // align-items center
  // cursor pointer
  // &:hover
  //   background-color #d8dadc

.icon
  width 20px
  height 20px
  display block
  // position absolute
  top 12px
  left 10px
  display flex
  justify-content center
  align-items center
  // transform translateY(-50%)
  &::after
    content ''
    display block
    width 0
    height 0
  &.icon-arrow::after
    width 0
    height 0
    border-top 4px solid transparent
    border-left 6px solid #a1a1a1
    border-bottom 4px solid transparent
  &.is-expanded::after
    transform rotate(90deg)

.transparent
  opacity 0
</style>
