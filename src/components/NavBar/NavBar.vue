<template>
  <div id="navbar">
    <Tree
      :item-height="'40px'"
      :data="nav"
      :labelProxy="'name'"
      :expand-on-click-node="false"
      :prevent-default-click="true"
      @insertChildNode="handleInsertChildNode"
      default-expand-all
      ref="tree">
      <div class="nav-node" slot-scope="{ node, data }">
        <div class="icon-folder"></div>
        <div class="title ellipsis"
          v-show="typingNode !== node">
          {{ data.title }}
        </div>
        <div class="click-mask"
          v-show="typingNode !== node"
          @click="handleItemClick(node)"
          @contextmenu.prevent="handleContextmenu(node)"></div>
        <input class="node-input"
          :class="{ 'show' : typingNode === node }"
          v-show="typingNode === node"
          v-model="nodeInput"
          @keyup.enter="$event.target.blur"
          @blur="handleNodeInputBlur"
          ref="nodeInput"/>
      </div>
    </Tree>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import Tree from '../Tree'
import { folderMenu, resourceMenu, recycleMenu, hookMenuEvent } from './Menu'
import { GenNonDuplicateID } from '@/utils/utils'

export default {
  name: 'NavBar',

  components: {
    Tree
  },

  data () {
    return {
      typingNode: null,
      popupedNode: null,
      duplicatedNode: null,
      folderMenu: null,
      resourceMenu: null,
      resourceMenu2: null,
      recycleMenu: null,
      nodeInput: '',
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
          title: '回收站',
          link: 'recycle',
          type: 'recycle'
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      folders: 'GET_FOLEDERS'
    })
  },

  watch: {
    folders (val) {
      this.initNav(val)
    }
  },

  created () {
    this.initMenus()
  },

  methods: {
    ...mapActions([
      'ADD_FILES',
      'DELETE_FILE',
      'EDIT_FILE',
      'SET_VIEW_NAME',
      'SET_VIEW_FILE_TYPE',
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    initNav (folders) {
      console.log('initNav', folders)
      let rootChildFolders = []
      for (let i in folders) {
        if (folders[i].ancestor_folders.length === 0) {
          rootChildFolders.push(folders[i])
        }
      }
      let rootFolder = rootChildFolders
        .map(folder => this.translateFolderData(folder, folders))[0]
      
      for (let i in rootFolder) {
        this.$set(this.nav[1], i, rootFolder[i])
      }
    },

    translateFolderData (folder, folders) {
      let result = {}
      for (let i in folder) {
        result[i] = folder[i]
      }
      result.children = folder.child_folders.map(id => {
        return this.translateFolderData(folders[id], folders)
      })
      return result
    },

    initMenus () {
      const folderMenuWithEvent = hookMenuEvent(folderMenu, this)
      const resourceMenuWithEvent1 = hookMenuEvent(resourceMenu[0], this)
      const resourceMenuWithEvent2 = hookMenuEvent(resourceMenu[1], this)
      const recycleMenuWithEvent = hookMenuEvent(recycleMenu, this)
      this.folderMenu = this.createMenu(folderMenuWithEvent)
      this.resourceMenu = this.createMenu([
        ...folderMenuWithEvent,
        ...resourceMenuWithEvent1
      ])
      this.resourceMenu2 = this.createMenu([
        ...folderMenuWithEvent,
        ...resourceMenuWithEvent2
      ])
      this.recycleMenu = this.createMenu(recycleMenuWithEvent)
    },

    createMenu (itemOpts) {
      const Menu = this.$remote.Menu
      const MenuItem = this.$remote.MenuItem
      let menu = new Menu()
      
      for (let i = 0, len = itemOpts.length; i < len; i++) {
        menu.append(new MenuItem(itemOpts[i]))
      }
      return menu
    },

    popupMenu (menu) {
      menu.popup({ window: this.$remote.getCurrentWindow() })
    },

    handleItemClick (node) {
      node.instance.handleClick()
      this.SET_VIEW_NAME(node.data.title)
      this.SET_VIEW_FILE_TYPE(node.data.link)
    },

    handleContextmenu (node) {
      this.popupedNode = node
      const d = node.data
      if (d.type === 'folder' && d.link === 'folders') {
        this.popupMenu(this.folderMenu)
      }
      if (d.type === 'folder') {
        const resourceMenu = !this.duplicatedNode ? this.resourceMenu : this.resourceMenu2
        this.popupMenu(resourceMenu)
      }
      if (d.type === 'recycle') {
        this.popupMenu(this.recycleMenu)
      }
    },

    handleNewDoc () {
      console.log('handleNewDoc', this.popupedNode)
    },

    handleNewFolder () {
      console.log('handleNewFolder', this.popupedNode.data)
      let id = GenNonDuplicateID(6)
      this.ADD_FILES({
        title: '新建文件夹',
        link: 'new folder',
        type: 'folder',
        id: id,
        parent_folder: this.popupedNode.data.id,
      }).then(() => {
        for (let i in this.popupedNode.store.nodeMap) {
          let node = this.popupedNode.store.nodeMap[i]
          if (node.data.id === id) {
            this.handleInsertChildNode(node)
            return
          }
        }
      })
    },

    handleInsertChildNode (childNode) {
      this.popupedNode = childNode
      this.handleRename()
    },

    handleUpload () {
      console.log('handleUpload', this.popupedNode)
    },

    handleRename () {
      console.log('handleRename', this.popupedNode)
      this.typingNode = this.popupedNode
      this.nodeInput = this.typingNode.data.title
      this.$nextTick(() => {
        const inputEl = document.querySelectorAll('input.node-input.show')
        inputEl[0].select()
      })
    },

    handleNodeInputBlur () {
      console.log('handleNodeInputBlur')
      this.EDIT_FILE({
        id: this.typingNode.data.id,
        attr: 'title',
        val: this.nodeInput
      })
      // this.typingNode.data.title = this.nodeInput
      this.typingNode = null
      console.log(this.nav)
    },

    handleRemove () {
      console.log('handleRemove', this.popupedNode)
      this.TOGGLE_SHOW_MOVE_PANEL()
    },

    handleDuplicate () {
      console.log('handleDuplicate', this.popupedNode)
      this.duplicatedNode = this.popupedNode
    },

    handlePaste () {
      console.log('handlePaste', this.duplicatedNode)
      let duplicateData = cloneDeep(this.duplicatedNode.data)
      this.popupedNode.instance.insertChild(duplicateData)
    },

    handleDelete () {
      console.log('handleDelete', this.popupedNode)
      this.DELETE_FILE(this.popupedNode.data.id)
    },

    handleClearRecycle () {
      console.log('handleClearRecycle', this.popupedNode)
    },

    handleResumeRecycle () {
      console.log('handleResumeRecycle', this.popupedNode)
    }
  }
}
</script>

<style lang="stylus" scoped>
#navbar
  width 220px

.child
  background-color #fff

.nav-node
  position relative
  width 100%
  height 100%
  display flex
  align-items center
  -webkit-box-flex 1
  .title
    font-size 14px
    &.ellipsis
      // padding-left 8px
  .click-mask
    position absolute
    width 100%
    height 100%
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
    border-left 6px solid #a1a1a1
    border-bottom 4px solid transparent
  &.icon-expanded::after
    transform rotate(90deg)

.icon-folder
  width 26px
  height 14px
  background-color #b3b3b3
  margin-right 10px
</style>
