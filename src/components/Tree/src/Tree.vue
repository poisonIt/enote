<template>
  <div class='tn'>
    <div v-if="model.name !== 'root'">
      <div class="tn-border tn-up" :class="{'tn-active': isDragEnterUp}"
        @drop="dropUp"
        @dragenter="dragEnterUp"
        @dragover='dragOverUp'
        @dragleave="dragLeaveUp"></div>
      <div :id='model.id' :class="treeNodeClass"
        :draggable="!model.dragDisabled"
        @dragstart='dragStart'
        @dragover='dragOver'
        @dragenter='dragEnter'
        @dragleave='dragLeave'
        @drop='drop'
        @dragend='dragEnd'
        @mouseover='mouseOver'
        @mouseout='mouseOut'
        @contextmenu.prevent="contextmenu"
        @click.stop='click'
        @dblclick.prevent.stop="toggle">
        <div class="tn-mask" :class="{ current: isCurrent }"></div>
        <span class="tn-caret tn-is-small" :class="{ lucency: !model.children || model.children.length === 0 }">
          <i class="tn-icon" :class="caretClass" @click.prevent.stop="toggle"></i>
        </span>

        <span v-if="model.isLeaf">
          <slot name="leafNodeIcon">
            <i class="tn-icon tn-menu-icon tn-icon-file"></i>
          </slot>
        </span>
        <span v-else>
          <slot name="treeNodeIcon">
            <i class="tn-icon tn-menu-icon"
              :class="[itemIconClass, { current: isCurrent }, { expanded: expanded }]"></i>
          </slot>
        </span>

        <div class="tn-node-content ellipsis" v-if="!editable">
          {{model.name}}
        </div>
        <input v-else class="tn-input" type="text" ref="nodeInput" :value="model.name" @input="updateName" @blur="blur">
        <div class="tn-operation" v-show="isHover">
          <span title="add tree node" @click.stop.prevent="addChild({}, false, false)" v-if="!model.isLeaf && !model.addTreeNodeDisabled">
            <slot name="addTreeNode">
              <i class="tn-icon tn-icon-folder-plus-e"></i>
            </slot>
          </span>
          <span title="add leaf node" @click.stop.prevent="addChild({}, false, true)" v-if="!model.isLeaf && !model.addLeafNodeDisabled">
            <slot name="addLeafNode">
              <i class="tn-icon tn-icon-plus"></i>
            </slot>
          </span>
          <span title="edit" @click.stop.prevent="setEditable" v-if="!model.editNodeDisabled">
            <slot name="editNode">
              <i class="tn-icon tn-icon-edit"></i>
            </slot>
          </span>
          <span title="delete" @click.stop.prevent="delNode" v-if="!model.delNodeDisabled">
            <slot name="delNode">
              <i class="tn-icon tn-icon-trash"></i>
            </slot>
          </span>
        </div>
      </div>

      <div v-if="model.children && model.children.length > 0 && expanded"
        class="tn-border tn-bottom"
        :class="{'tn-active': isDragEnterBottom}"
        @drop="dropBottom"
        @dragenter="dragEnterBottom"
        @dragover='dragOverBottom'
        @dragleave="dragLeaveBottom"></div>
    </div>

    <div :class="{'tn-tree-margin': model.name !== 'root'}" v-show="model.name === 'root' || expanded" v-if="isFolder">
      <Tree v-for="model in model.children"
        :default-tree-node-name="defaultTreeNodeName"
        :default-leaf-node-name="defaultLeafNodeName"
        :flat-ids="flatIds"
        v-bind:default-expanded="defaultExpanded"
        :model="model"
        :key='model.id'>
          <slot name="addTreeNode" slot="addTreeNode" />
          <slot name="addLeafNode" slot="addLeafNode" />
          <slot name="editNode" slot="editNode" />
          <slot name="delNode" slot="delNode" />
      </Tree>
    </div>
  </div>
</template>

<script>
import { Tree, TreeStore, TreeNode } from '../index.js'
import Emitter from '@/utils/mixins/emitter'
import { addHandler, removeHandler } from './tools.js'
let fromComp = null

export default {
  name: 'Tree',

  mixins: [ Emitter ],

  components: {
    Tree
  },

  data () {
    return {
      isHover: false,
      editable: false,
      isDragEnterUp: false,
      isDragEnterBottom: false,
      isDragEnterNode: false,
      expanded: this.defaultExpanded
    }
  },

  props: {
    model: {
      type: Object
    },

    defaultLeafNodeName: {
      type: String,
      default: 'New leaf node'
    },

    defaultTreeNodeName: {
      type: String,
      default: 'New tree node'
    },

    defaultExpanded: {
      type: Boolean,
      default: true
    },

    flatIds: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    isCurrent () {
      return this.model === this.model.store.currentNode
    },

    itemIconClass () {
      if (this.model.data.type === 'folder') {
        return this.model.isLeaf ? 'tn-icon-file' : 'tn-icon-folder'
      } else {
        return 'tn-icon-' + this.model.data.type
      }
    },

    caretClass () {
      return this.expanded ? 'tn-icon-caret-down' : 'tn-icon-caret-right'
    },

    isFolder () {
      return this.model.children &&
        this.model.children.length
    },

    treeNodeClass () {
      const {
        model: {
          dragDisabled,
          disabled
        },
        isDragEnterNode
      } = this
      const isFat = this.flatIds.indexOf(this.model.id) > -1

      return {
        'tree-node': true,
        'tn-active': isDragEnterNode,
        'tn-drag-disabled': dragDisabled,
        'tn-disabled': disabled,
        'tn-fat': isFat
      }
    }
  },

  // beforeCreate () {
  //   this.$options.components.item = require('./Tree.vue')
  // },

  created () {
    this.model.instance = this
    this.id = this.model.data ? this.model.id : '0'
    this.$on('select', (params) => {
      if (this.model.id === params.id) {
        this.click()
      }
    })
    this.$on('update-model', (params) => {
      if (this.model.id === params.id) {
        for (let i in this.model.store.cacheProperty) {
          if (i !== 'id') {
            this.model[i] = this.model.store.cacheProperty[i]
          }
        }
      }
    })
  },

  mounted () {
    const vm = this
    addHandler(window, 'keyup', function (e) {
      // click enter
      if (e.keyCode === 13 && vm.editable) {
        vm.editable = false
      }
    })
    if (this.model.editable) {
      this.setEditable()
    }

    // let root = this.getRootNode()
    // if (this.model.id === '0' && this.model.name !== 'root') {
    //   console.log('set', this.model)
    //   this.model.store.setCurrentNode(this.model, root)
    // }
  },

  beforeDestroy () {
    removeHandler(window, 'keyup')
  },

  methods: {
    updateName(e) {
      var oldName = this.model.name;
      this.model.changeName(e.target.value)
      var node = this.getRootNode()
      node.$emit('change-name', {
        'id': this.model.id,
        'oldName': oldName,
        'newName': e.target.value
      })
    },

    delNode () {
      var node = this.getRootNode()
      node.$emit('delete-node', this.model)
    },

    setEditable () {
      this.editable = true
      this.$nextTick(() => {
        const $input = this.$refs.nodeInput
        $input.focus()
        $input.setSelectionRange(0, $input.value.length)
      })
    },

    blur () {
      this.editable = false
      var node = this.getRootNode();
      node.$emit('change-name-blur', this.model)
    },

    setUnEditable () {
      this.editable = false
    },

    toggle () {
      console.log('toggle')
      if (this.isFolder) {
        this.expanded = !this.expanded
      }
    },

    mouseOver (e) {
      return
      if (this.model.disabled) return
      this.isHover = true
    },

    mouseOut(e) {
      return
      this.isHover = false
    },

    contextmenu () {
      var root = this.getRootNode()
      root.$emit('contextmenu', this)
    },

    updateNodeModel (params) {
      this.model.store.cacheProperty = params
      this.broadcast('tree', 'update-model', {
        id: params.id
      }, true)
    },

    select (id) {
      this.broadcast('tree', 'select', {
        id: id
      }, true)
    },

    selectParent () {
      let parentId = this.model.store.currentNode.parent.id
      if (parentId === 0) return
      this.select(parentId)
    },

    click () {
      var root = this.getRootNode()
      this.model.store.setCurrentNode(this.model, root)
      root.$emit('click', this.model)
    },

    addChild (data, editable, isLeaf) {
      const name = isLeaf ? this.defaultLeafNodeName : this.defaultTreeNodeName
      this.expanded = true
      var node = new TreeNode({
        name,
        isLeaf,
        editable,
        data: data
      }, this.model.store)
      this.model.addChildren(node, true)
      var root = this.getRootNode()
      this.model.store.setCurrentNode(node, root)
      root.$emit('add-node', node)
    },

    dragStart (e) {
      if (!(this.model.dragDisabled || this.model.disabled)) {
        fromComp = this
        // for firefox
        e.dataTransfer.setData("data", "data")
        e.dataTransfer.effectAllowed = 'move'
        return true
      }
      return false
    },

    dragEnd(e) {
      fromComp = null
    },

    dragOver(e) {
      e.preventDefault()
      return true
    },

    dragEnter(e) {
      if (!fromComp) return
      if (this.model.isLeaf) return
      this.isDragEnterNode = true
    },

    dragLeave(e) {
      this.isDragEnterNode = false
    },

    drop(e) {
      if (!fromComp) return
      const oldParent = fromComp.model.parent
      fromComp.model.moveInto(this.model)
      this.isDragEnterNode = false
      var node = this.getRootNode()
      node.$emit('drop', {
        node: fromComp.model,
        oldParent: oldParent
      })
    },

    dragEnterUp () {
      if (!fromComp) return
      this.isDragEnterUp = true
    },

    dragOverUp(e) {
      e.preventDefault()
      return true
    },

    dragLeaveUp () {
      if (!fromComp) return
      this.isDragEnterUp = false
    },

    dropUp () {
      if (!fromComp) return
      const oldParent = fromComp.model.parent;
      fromComp.model.insertBefore(this.model)
      this.isDragEnterUp = false
      var node = this.getRootNode();
      node.$emit('drop-up', {
        node: fromComp.model,
        oldParent: oldParent
      })
    },

    dragEnterBottom () {
      if (!fromComp) return
      this.isDragEnterBottom = true
    },

    dragOverBottom(e) {
      e.preventDefault()
      return true
    },

    dragLeaveBottom () {
      if (!fromComp) return
      this.isDragEnterBottom = false
    },

    dropBottom () {
      if (!fromComp) return
      const oldParent = fromComp.model.parent;
      fromComp.model.insertAfter(this.model)
      this.isDragEnterBottom = false
      var node = this.getRootNode()
      node.$emit('drop-bottom', {
        node: fromComp.model,
        oldParent: oldParent
      })
    },

    getRootNode () {
      var node = this.$parent
      if (this.model.name === 'root') {
        return this
      }
      while (node._props.model.name !== 'root') {
        node = node.$parent
      }
      return node
    }
  }
}
</script>

<style lang="stylus" scoped>
.lucency
  opacity 0

.tree-node
  display flex
  align-items center
  height 30px
  // padding 5px 0 5px 1rem
  background-color inherit
  color #fff
  font-size 13px
  .tn-input
    border none
    max-width 150px
    border-bottom 1px solid blue
    z-index 1
  &:hover
    background-color inherit
  &.tn-active
    .tn-mask
      border 1px dashed #DDAF59
      background-color #464646
  &.tn-current
    background-color #313336
  &.tn-fat
    height 40px
    .tn-mask
      height 40px
  .tn-caret
    // margin-left -1rem
    // margin-right 10px
  .tn-operation
    margin-left 2rem
    letter-spacing 1px
.tn-item
  cursor pointer
.tn-tree-margin
  margin-left 14px

.tn-border
  display none
  position absolute
  width 100%
  left 0
  height 8px
  z-index 1
  &.tn-up
    top 0
    background-color red
  &.tn-bottom
    bottom 0
    background-color blue
  &.tn-active
    border-bottom 3px dashed blue
    /*background-color blue;*/

.tn-mask
  position absolute
  left 0
  width 100%
  height 30px
  background-color transparent
  z-index 0
  &.current
    background-color #313336
    border-right 3px solid #DDAF59

.tn-node-content
  height 30px
  line-height 33px
  z-index 1

.tn-icon
  display block
  position relative
  width 22px
  height 22px
  background-repeat  no-repeat
  background-size 100%
  background-position center
.tn-icon-caret-right, .tn-icon-caret-down
  &::after
    content ''
    display block
    position absolute
    top 50%
    left 50%
    transform translate(-50%, -50%)
    width 0
    height 0
    border-top 3px solid transparent
    border-left 4px solid #C2C2C2
    border-bottom 3px solid transparent
.tn-icon-caret-down
  transform rotate(90deg)
.tn-menu-icon
  margin-right 10px
.tn-icon-latest
  background-image url(../../../assets/images/lanhu/documents@2x.png)
  &.current
    background-image url(../../../assets/images/lanhu/documents_highlight@2x.png)
.tn-icon-folder
  background-image url(../../../assets/images/lanhu/folder_close@2x.png)
  &.expanded
    background-image url(../../../assets/images/lanhu/folder_open@2x.png)
  &.current
    background-image url(../../../assets/images/lanhu/folder_close_highlight@2x.png)
    &.expanded
     background-image url(../../../assets/images/lanhu/folder_open_highlight@2x.png)
.tn-icon-tag
  background-image url(../../../assets/images/lanhu/tag@2x.png)
  &.current
    background-image url(../../../assets/images/lanhu/tag_highlight@2x.png)
.tn-icon-bin
  background-image url(../../../assets/images/lanhu/recycle@2x.png)
  &.current
    background-image url(../../../assets/images/lanhu/recycle_highlight@2x.png)
</style>
