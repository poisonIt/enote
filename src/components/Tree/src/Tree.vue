<template>
  <div class="tree" role="tree" :style="computedStyle">
    <tree-node
      v-for="child in root.childNodes"
      :key="child.uid"
      :node="child"
      :theme="theme"
      :render-content="renderContent">
    </tree-node>
  </div>
</template>

<script>
import TreeNode from './TreeNode'
import TreeStore from './TreeStore'
import { TreeMixins } from '../mixins'

export default {
  name: 'BTree',

  mixins: TreeMixins,

  data () {
    return {
      root: null
    }
  },

  components: {
    TreeNode
  },

  props: {
    styles: {
      type: Object,
      default: () => ({})
    },
    theme: {
      type: String,
      default: 'default'
    },
    width: String,
    itemHeight: String,
    itemHeightMini: String,
    data: Array,
    labelProxy: String,
    defaultExpandAll: Boolean,
    preventDefaultClick: {
      type: Boolean,
      default: false
    },
    expandOnClickNode: {
      type: Boolean,
      default: false
    },
    renderContent: Function,
    props: {
      default () {
        return {
          children: 'children',
          label: 'label',
          icon: 'icon',
          disabled: 'disabled'
        }
      }
    }
  },

  computed: {
    computedStyle () {
      return Object.assign(this.styles, {
        width: this.width
      })
    },

    // itemHeightNode () {
    //   return this.mini ? this.itemHeightMini : this.itemHeight
    // },

    children: {
      set (val) {
        this.data = val
      },
      get () {
        return this.data
      }
    }
  },

  watch: {
    data: {
      handler: function (newVal) {
        console.log('watch-tree-data', newVal)
        this.store.setData(newVal)
        this.$emit('input', [])
      },
      deep: true
    }
    // data (newVal) {
    //   console.log('tree-watch-data', newVal)
    //   this.store.setData(newVal)
    // }
  },

  created () {
    this.isTree = true

    this.store = new TreeStore({
      data: this.data,
      props: this.props,
      labelProxy: this.labelProxy,
      expandOnClickNode: this.expandOnClickNode,
      defaultExpandAll: this.defaultExpandAll,
      itemHeight: this.itemHeight
      // currentNode: this.currentNode
    })

    this.root = this.store.root
    this.store.instance = this
  },

  methods: {
    setNodeData (uid, data) {
      this.store.nodeMap[uid].setData(data)
    }
  }
}
</script>
