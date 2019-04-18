<template>
  <div class="tree-node"
    :class="{
      'dark' : theme === 'dark',
      'is-expanded' : expanded,
      'is-selected' : tree.store.currentNode === node
    }"
    v-show="node.visible">
    <div class="tree-node__content"
      :style="{ paddingLeft: node.level * 20 - 10 + 'px', height: 'auto' }">
      <div class="highlight-mask-line"
        v-if="isHighlightLine"
        ref="hightLightLine"
        :style="{
          left: node.level * 20 + 13 + 'px',
          top: hightlightTop ? '-4px' : null,
          bottom: hightlightTop ? null : '-4px',
        }"></div>
      <div class="highlight-mask" v-if="isHighlight"></div>
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
      <div class="icon-select"
        :class="{ selected : node.selected }"
        v-if="node.data.type === 'select'">
      </div>
    </div>
    <!-- <collapse-transition> -->
      <div class="tree-node_children" v-show="expanded">
        <tree-node
          v-for="child in node.childNodes"
          :key="child.uid"
          :theme="theme"
          :node="child">
        </tree-node>
      </div>
    <!-- </collapse-transition> -->
  </div>
</template>

<script>
import { NodeMixins } from '../mixins'
import { remove } from 'lodash'

export default {
  name: 'TreeNode',

  mixins: NodeMixins,

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
      expanded: false,
      isHighlight: false,
      isHighlightLine: false,
      hightlightTop: false
    }
  },

  props: {
    node: {
      default () {
        return {}
      }
    },

    theme: {
      type: String,
      default: 'default'
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
  },

  mounted () {
    if (this.tree.currentNodeData) {
      console.log('mounted-node', this.tree.currentNodeData)
      if (this.node.data.cache_id) {
        if (this.node.data.cache_id === this.tree.currentNodeData) {
          console.log('mounted-node-0000', this.node.data.cache_id)
          this.handleClick()
          this.node.store.instance.$emit('insertChildNode', this.node)
          // this.tree.setCurrentNodeData(null)
          return
        }
      }
      if (this.node.data.id === this.tree.currentNodeData) {
        console.log('mounted-node-1111', this.node.data.id)
        this.handleClick()
        // this.tree.setCurrentNodeData(null)
      }
    }
  },

  methods: {
    handleClick () {
      const store = this.tree.store
      this.tree.store.expandOnClickNode && this.handleExpand()
      store.setCurrentNode(this.node)
      if (this.node.data.type === 'select') {
        this.node.selected = !this.node.selected
        if (this.node.selected) {
          this.node.store.selectedNodes.push(this.node)
        } else {
          this.$delete(this.node.store.selectedNodes, this.node.store.selectedNodes.indexOf(this.node))
        }
        this.node.store.instance.$emit('input', this.node.store.selectedNodes)
      }
    },

    handleExpand () {
      if (this.expanded) {
        this.node.collapse()
      } else {
        this.node.expand()
      }
    },

    insertChild (childData) {
      if (!this.node.data.children) {
        this.$set(this.node.data, 'children', [])
      }
      const newChildNode = this.node.insertChild({
        data: childData
      })
      this.node.store.instance.$emit('insertChildNode', newChildNode)
    },

    expandAncestor () {
      if (this.node.parent &&
        this.node.parent.instance
      ) {
        this.node.parent.expand()
        this.node.parent.instance.expandAncestor()
      }
    },

    toggleHightlight (val) {
      for (let i in this.node.store.nodeMap) {
        this.node.store.nodeMap[i].instance.isHighlight = false
        this.node.store.nodeMap[i].instance.isHighlightLine = false
      }
      this.isHighlight = val
      this.isHighlightLine = false
      console.log('toggleHightlight', this.isHighlightLine, this.isHighlight)
    },

    toggleHightlightTop (val) {
      this.hightlightTop = true
      for (let i in this.node.store.nodeMap) {
        this.node.store.nodeMap[i].instance.isHighlight = false
        this.node.store.nodeMap[i].instance.isHighlightLine = false
      }
      this.isHighlightLine = val
      this.isHighlight = false
      console.log('toggleHightlightBottom', this.isHighlightLine, this.isHighlight)
    },

    toggleHightlightBottom (val) {
      this.hightlightTop = false
      for (let i in this.node.store.nodeMap) {
        this.node.store.nodeMap[i].instance.isHighlight = false
        this.node.store.nodeMap[i].instance.isHighlightLine = false
      }
      this.isHighlightLine = val
      this.isHighlight = false
      console.log('toggleHightlightBottom', this.isHighlightLine, this.isHighlight)
    }
  }
}
</script>

<style lang="stylus" scoped>
.tree-node
  position relative
  background-color #fff
  color #333
  &.is-selected
    background-color #FFF5E2
    color #DDAF59
    .tree-node__content
      border-right 3px solid #DDAF59
    & .tree-node
      color #333
      background-color #fff
      .tree-node__content
        border none
  &.dark
    background-color #3C3E44
    color #C2C2C2
    &.is-selected
      background-color #313336
      color #DDAF59
      & .tree-node
        color #C2C2C2
        background-color #3C3E44
.tree-node__content
  position relative
  height 26px
  display -webkit-box
  box-sizing border-box
  -webkit-box-orient horizontal
  -webkit-box-direction normal
  -webkit-box-align center
  -webkit-box-flex 0
  color inherit

.highlight-mask-line
  width 100%
  height 1px
  position absolute
  left 73px
  top 36px
  border .5px solid #DDAF59
  &::before
    content ''
    display block
    position absolute
    left -7px
    top 50%
    transform translateY(-50%)
    width 4px
    height 4px
    border-radius 50%
    border 1px solid #DDAF59

.highlight-mask
  width 100%
  height 100%
  position absolute
  left 0
  top 0
  border 1px dashed #DDAF59
  background-color rgba(221, 175, 89, .1)
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
    border-top 3px solid transparent
    border-left 4px solid #C2C2C2
    border-bottom 3px solid transparent
  &.is-expanded::after
    transform rotate(90deg)

.tree-node.is-selected
  .icon
    &::after
      border-left 4px solid #DDAF59
  & .tree-node .icon
    &::after
      border-left 4px solid #D8D8D8

.icon-select
  position absolute
  top 50%
  right 10px
  transform translateY(-50%)
  width 14px
  height 14px
  border-radius 50%
  border 1px solid #DDAF59
  &.selected
    border none
    background-size 110%
    background-image url('../../../assets/images/icon_selected_fill.png')

.transparent
  opacity 0
</style>
