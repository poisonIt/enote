<template>
  <div id="navbar">
    <Tree
      v-show="viewType === 'expanded'"
      :data="nav"
      :labelProxy="'name'"
      :expand-on-click-node="false"
      :prevent-default-click="true"
      @insertChildNode="handleInsertChildNode"
      default-expand-all
      ref="tree">
      <div class="nav-node"
        slot-scope="{ node, data }">
        <div class="icon"
          :class="iconClassComputed(node)"
          v-if="node.data.link"></div>
        <div class="title ellipsis"
          v-show="typingNode !== node">
          {{ data.title }}
        </div>
        <div class="click-mask"
          v-show="typingNode !== node"
          @click="handleItemClick(node)"
          @contextmenu.prevent="handleContextmenu(node.data)"></div>
         <div class="clear-tag"
          v-show="node.data.link === 'tag'"
          @click="handleClearTag()">
          <span>X</span>
          <span>清空</span>
        </div>
        <input class="node-input"
          :class="{ 'show' : typingNode === node }"
          v-show="typingNode === node"
          v-model="nodeInput"
          @keyup.enter="$event.target.blur"
          @blur="handleNodeInputBlur"
          ref="nodeInput"/>
      </div>
    </Tree>
    <div class="nav-mini" v-show="viewType === 'unexpanded'">
      <div class="icon icon-latest"
        :class="{ active : navMiniActive('latest') }"
        @click="handleClickMini('latest')">
      </div>
      <div class="icon icon-folders"
        :class="{ active : navMiniActive(['folders', 'new folder']) }"
        @click="handleClickMini('folders')">
      </div>
      <div class="icon icon-recycle"
        :class="{ active : navMiniActive('recycle') }"
        @click="handleClickMini('recycle')">
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import { folderMenu, resourceMenu, recycleMenu } from '../Menu'
import { GenNonDuplicateID } from '@/utils/utils'
import mixins from '../mixins'
import Tree from '@/components/Tree'

export default {
  name: 'NavBar',

  mixins: mixins,

  components: {
    Tree
  },

  data () {
    return {
      initFlag: true,
      typingNode: null,
      currentNode: null,
      popupedNode: null,
      duplicatedNode: null,
      nativeMenuData: [
        folderMenu,
        [...folderMenu, ...resourceMenu[0]],
        [...folderMenu, ...resourceMenu[1]],
        recycleMenu
      ],
      nodeInput: '',
      folderIndex: 1,
      nav: [
        {
          title: '最新文档',
          link: 'latest',
          type: 'docs'
        },
        {
          title: '我的文件夹',
          link: 'folders',
          type: 'folder',
          children: []
        },
        {
          title: '标签',
          link: 'tags',
          type: 'tag',
          children: [
            {
              title: '标签一',
              type: 'select'
            },
            {
              title: '标签二',
              type: 'select'
            },
            {
              title: '标签三',
              type: 'select'
            }
          ]
        },
        {
          title: '回收站',
          link: 'recycle',
          type: 'recycle'
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE'
    })
  },

  mounted () {
    const curNode = this.$refs.tree.store.currentNode
    this.handleItemClick(curNode)
  },

  methods: {
    ...mapActions([
      'ADD_FILE',
      'DELETE_FILE',
      'EDIT_FILE',
      'CLEAR_ALL_RECYCLE',
      'RESUME_ALL_RECYCLE',
      'SET_VIEW_FOLDER',
      'SET_VIEW_NAME',
      'SET_VIEW_FILE_TYPE',
      'SET_CURRENT_FOLDER',
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    getTreeNode (link) {
      let nodeMap = this.$refs.tree.store.nodeMap
      for (let i in nodeMap) {
        let node = nodeMap[i]
        if (node.data.link === link) {
          return node
        }
      }
    },

    setCurrentFolder (id) {
      let nodeMap = this.$refs.tree.store.nodeMap
      for (let i in nodeMap) {
        let node = nodeMap[i]
        if (node.data.id === id) {
          this.handleItemClick(node)
          return
        }
      }
    },

    handleItemClick (node) {
      node.instance.handleClick()
      this.currentNode = node
      this.SET_VIEW_FOLDER(node.uid)
      this.SET_VIEW_NAME(node.data.title)
      this.SET_VIEW_FILE_TYPE(node.data.link)
      if (node.data.type === 'folder') {
        this.SET_CURRENT_FOLDER(node.data.id)
      }
    },

    handleContextmenu (node) {
      this.popupedNode = node
      const d = node.data
      if (d.type === 'folder' && d.link === 'folders') {
        this.popupNativeMenu(this.nativeMenus[0])
      }
      if (d.type === 'folder') {
        const resourceMenu = !this.duplicatedNode
          ? this.nativeMenus[1]
          : this.nativeMenus[2]
        this.popupNativeMenu(resourceMenu)
      }
      if (d.type === 'recycle') {
        this.popupNativeMenu(this.nativeMenus[3])
      }
    },

    handleNewDoc (isCurrent) {
      if (isCurrent) {
        this.popupedNode = this.currentNode
      }
      if (this.popupedNode === null ||
        this.popupedNode.data.link === 'latest' ||
        this.popupedNode.data.link === 'recycle') {
        this.popupedNode = this.getTreeNode('folders')
      }
      let id = GenNonDuplicateID(6)
      this.ADD_FILE({
        title: '无标题笔记',
        type: 'doc',
        id: id,
        parent_folder: this.popupedNode.data.id
      }).then(() => {
        this.$nextTick(() => {
          for (let i in this.popupedNode.store.nodeMap) {
            let node = this.popupedNode.store.nodeMap[i]
            if (node.data.id === this.popupedNode.data.id) {
              this.handleItemClick(node)
              return
            }
          }
        })
      })
    },

    handleNewFolder (isCurrent) {
      if (isCurrent) {
        this.popupedNode = this.currentNode
      }
      if (this.popupedNode === null ||
        this.popupedNode.data.link === 'latest' ||
        this.popupedNode.data.link === 'recycle') {
        this.popupedNode = this.getTreeNode('folders')
      }
      let id = GenNonDuplicateID(6)
      this.ADD_FILE({
        title: '新建文件夹',
        link: 'new folder',
        type: 'folder',
        id: id,
        parent_folder: this.popupedNode.data.id
      }).then(() => {
        this.$nextTick(() => {
          for (let i in this.popupedNode.store.nodeMap) {
            let node = this.popupedNode.store.nodeMap[i]
            if (node.data.id === id) {
              this.handleInsertChildNode(node)
              this.handleItemClick(node)
              return
            }
          }
        })
      })
    },

    handleInsertChildNode (childNode) {
      this.popupedNode = childNode
      this.handleRename()
    },

    handleUpload () {
    },

    handleRename () {
      this.typingNode = this.popupedNode
      this.nodeInput = this.typingNode.data.title
      this.$nextTick(() => {
        const inputEl = document.querySelectorAll('input.node-input.show')
        console.log('inputEl', inputEl[0])
        inputEl[0].select()
      })
    },

    handleNodeInputBlur () {
      this.EDIT_FILE({
        id: this.typingNode.data.id,
        attr: 'title',
        val: this.nodeInput
      })
      // this.typingNode.data.title = this.nodeInput
      this.$nextTick(() => {
        for (let i in this.typingNode.store.nodeMap) {
          let nodeTemp = this.typingNode.store.nodeMap[i]
          if (nodeTemp.data.id === this.typingNode.data.id) {
            this.handleItemClick(nodeTemp)
            this.typingNode = null
            return
          }
        }
      })
    },

    handleMove () {
      this.TOGGLE_SHOW_MOVE_PANEL(this.currentNode.data.id)
    },

    handleDuplicate () {
      this.duplicatedNode = this.popupedNode
    },

    handlePaste () {
      let duplicateData = cloneDeep(this.duplicatedNode.data)
      this.popupedNode.instance.insertChild(duplicateData)
    },

    clickRecycleNode () {
      this.$nextTick(() => {
        let recycleNode = this.$refs.tree.store.root.childNodes[2]
        this.handleItemClick(recycleNode)
      })
    },

    handleDelete () {
      this.SET_CURRENT_FOLDER('000000')
      this.DELETE_FILE(this.popupedNode.data.id)
      this.clickRecycleNode()
    },

    handleClearRecycle () {
      this.CLEAR_ALL_RECYCLE()
      this.clickRecycleNode()
    },

    handleResumeRecycle () {
      this.RESUME_ALL_RECYCLE()
      this.clickRecycleNode()
    },

    handleClearTag () {
      console.log('handleClearTag')
    },

    iconClassComputed (node) {
      if (node.data.type === 'folder') {
        return node.expanded ? 'icon-folder_open' : 'icon-folder_close'
      }
      return 'icon-' + node.data.link
    },

    // navIcon (node) {
    //   return 'icon-' + node.data.link
    // },

    handleClickMini (link) {
      this.$hub.dispatchHub('clickNavMini', this, link)
    },

    navMiniActive (link) {
      if (link instanceof Array) {
        return link.indexOf(this.viewFileType) > -1
      } else {
        return this.viewFileType === link
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
#navbar
  flex 1
  padding-bottom 30px
  overflow-y scroll

.child
  background-color #fff

.nav-node
  position relative
  width 100%
  height 40px
  display flex
  align-items center
  -webkit-box-flex 1
  &.unexpanded
    height 60px
  .title
    font-size 14px
    &.ellipsis
      // padding-left 8px
  .clear-tag
    position absolute
    display flex
    align-items center
    top 50%
    right 18px
    transform translateY(-50%)
    text-align center
    font-size 12px
    color #3161A3
    & span:nth-of-type(1)
      display block
      transform scaleY(0.8)
  .click-mask
    position absolute
    width 100%
    height 100%
  .icon
    width 22px
    height 22px
    margin-right 10px
  .node-input
    width 98%
    height 26px
    padding-left 10px
    border-radius 3px
    border 1px solid #73a8d6
    outline none
    font-size 14px
    .icon
      width 16px
      height 16px
      display block
      position absolute
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
      &.icon-expand::after
        width 0
        height 0
        border-top 4px solid transparent
        border-left 6px solid #13ABC4
        border-bottom 4px solid transparent
      &.icon-expanded::after
        transform rotate(90deg)

.nav-mini
  width 100%
  display flex
  flex-direction column
  .icon
    width 80px
    height 80px
    background-repeat  no-repeat
    background-size 28%
    background-position center
    &.active
      background-color #eff0f1

.icon
  background-repeat  no-repeat
  background-size 100%
  background-position center
.icon-latest
  width 28px !important
  background-image url(../../../assets/images/lanhu/documents@2x.png)
.icon-folder_open
  background-image url(../../../assets/images/lanhu/folder_open@2x.png)
.icon-folder_close
  background-image url(../../../assets/images/lanhu/folder_close@2x.png)
.icon-tags
  background-image url(../../../assets/images/lanhu/tag@2x.png)
.icon-recycle
  background-image url(../../../assets/images/lanhu/recycle@2x.png)
.icon-folder
  display block
  margin-right 6px
  width 24px
  height 24px
  opacity 0.8
  background-image url(../../../assets/images/folder-open-fill.png)
  background-repeat no-repeat
  background-size contain
  background-position center
</style>
