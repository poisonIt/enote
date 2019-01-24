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
      initFlag: true,
      typingNode: null,
      currentNode: null,
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
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      folders: 'GET_FOLEDERS'
    })
  },

  watch: {
    folders (val, oldVal) {
      if (val !== oldVal) {
        this.initNav(val)
      }
    }
  },

  created () {
    this.initMenus()
    this.$hub.$on('newDoc', () => this.handleNewDoc(true))
    this.$hub.$on('newFolder', () => this.handleNewFolder(true))
  },

  mounted () {
  },

  methods: {
    ...mapActions([
      'ADD_FILES',
      'DELETE_FILE',
      'EDIT_FILE',
      'SET_VIEW_NAME',
      'SET_VIEW_FILE_TYPE',
      'SET_CURRENT_FOLDER',
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    initNav (folders) {
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

      // let rootNode = this.$refs.tree.store.root
      // this.$refs.tree.setNodeData(rootNode.childNodes[1].uid, rootFolder)

      // if (this.initFlag) {
      //   this.handleItemClick(this.$refs.tree.store.root.childNodes[0])
      //   this.initFlag = false
      // }
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

    getTreeNode (link) {
      let nodeMap = this.$refs.tree.store.nodeMap
      for (let i in nodeMap) {
        let node = nodeMap[i]
        if (node.data.link === link) {
          return node
        }
      }
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
      console.log('handleItemClick', node)
      node.instance.handleClick()
      this.currentNode = node
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

    handleNewDoc (isCurrent) {
      if (isCurrent) {
        this.popupedNode = this.currentNode
      }
      if (this.popupedNode === null ||
        this.popupedNode.data.link === 'latest' ||
        this.popupedNode.data.link === 'recycle') {
          this.popupedNode = this.getTreeNode('folders')
      }
      console.log('popupedNode', this.popupedNode)
      let id = GenNonDuplicateID(6)
      this.ADD_FILES({
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
      console.log('popupedNode', this.popupedNode)
      let id = GenNonDuplicateID(6)
      this.ADD_FILES({
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

    handleRemove () {
      this.TOGGLE_SHOW_MOVE_PANEL()
    },

    handleDuplicate () {
      this.duplicatedNode = this.popupedNode
    },

    handlePaste () {
      let duplicateData = cloneDeep(this.duplicatedNode.data)
      this.popupedNode.instance.insertChild(duplicateData)
    },

    handleDelete () {
      this.SET_CURRENT_FOLDER(null)
      this.DELETE_FILE(this.popupedNode.data.id)
    },

    handleClearRecycle () {
    },

    handleResumeRecycle () {
    },

    navIcon (node) {
      return 'icon-' + node.data.link
    },

    handleClickMini (link) {
      this.$hub.$emit('clickNavMini', link)
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
  width 100%
  height 100%
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
  .icon-latest
    background-image url(../../assets/images/documents.png)
  .icon-folders
    background-image url(../../assets/images/folders.png)
  .icon-recycle
    background-image url(../../assets/images/recycle.png)

.icon-folder
  width 26px
  height 14px
  background-color #b3b3b3
  margin-right 10px

</style>
