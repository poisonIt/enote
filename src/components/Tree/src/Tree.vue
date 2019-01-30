<template>
  <div class="tree" role="tree" :style="computedStyle">
    <tree-node
      v-for="child in root.childNodes"
      :key="child.uid"
      :node="child"
      :render-content="renderContent">
    </tree-node>
  </div>
</template>

<script>
import TreeNode from './TreeNode'
import TreeStore from './TreeStore'
import EventHub from '@/utils/mixins/eventhub'

export default {
  name: 'BTree',

  mixins: [EventHub],

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
        this.store.setData(newVal)
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
    this.hookHub('navUp', 'DocumentList', () => {
      const parentInstance = this.store.currentNode.parent.instance
      if (parentInstance) {
        const rootParent = this.store.instance.$parent
        rootParent.handleItemClick(parentInstance.node)
      }
    })
  },

  methods: {
    setNodeData (uid, data) {
      this.store.nodeMap[uid].setData(data)
    }
  }
}
</script>
