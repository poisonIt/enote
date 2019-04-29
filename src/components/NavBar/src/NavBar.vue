<template>
  <div id="navbar" ref="navbar">
    <Tree
      ref="tree"
      :model="folderTree"
      default-tree-node-name="新建文件夹"
      v-bind:default-expanded="true"
      :flat-ids="['0', 'latest', 'share', 'tag', 'bin']"
      @contextmenu="handleContextmenu"
      @add-node="handleAddNode"
      @set-current="handleSetCurrentFolder"
      @change-name-blur="handleChangeNodeName"
      @drop="handleNodeDrop">
    </Tree>
    <div class="nav-mini" v-show="viewType === 'unexpanded'">
      <div class="icon icon-latest"
        :class="{
          active : navMiniActive('latest'),
          highlight : navMiniActive('latest')
        }"
        @click="handleClickMini('latest')">
      </div>
      <div class="icon icon-share"
        :class="{
          active : navMiniActive(['share']),
          highlight : navMiniActive(['share'])
        }"
        @click="handleClickMini('share')">
      </div>
      <div class="icon icon-folder_open"
        :class="{
          active : navMiniActive(['folders', 'new folder']),
          highlight : navMiniActive(['folders', 'new folder'])
        }"
        @click="handleClickMini('folders')">
      </div>
      <div class="icon icon-tags"
        :class="{
          active : navMiniActive('tags'),
          highlight : navMiniActive('tags')
        }"
        @click="handleClickMini('tags')">
      </div>
      <div class="icon icon-recycle"
        :class="{
          active : navMiniActive('recycle'),
          highlight : navMiniActive('recycle')
        }"
        @click="handleClickMini('recycle')">
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { cloneDeep } from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import {
  folderMenu,
  rootFolderMenu,
  resourceMenu,
  recycleMenu,
  tagMenu
} from '../Menu'
import { GenNonDuplicateID } from '@/utils/utils'
import mixins from '../mixins'
import { Tree, TreeStore, TreeNode } from '@/components/Tree'
import LocalDAO from '../../../../db/api'
import {
  getAllLocalFolder,
  addLocalFolder,
  updateLocalFolder,
  addLocalNote
} from '@/service/local'
// import folderData from '../folderData'
const latestNav = {
  name: '最新文档',
  id: 'latest',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'latest'
  }
}

const rootFolder = {
  name: '我的文件夹',
  id: '0',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'folder'
  }
}

const tagNav = {
  name: '标签',
  id: 'tag',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'tag'
  }
}

const binNav = {
  name: '回收站',
  id: 'bin',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'bin'
  }
}

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
      dragNode: null,
      dragOverNode: null,
      nativeMenuData: [
        rootFolderMenu,
        [...folderMenu, ...resourceMenu[0]],
        [...folderMenu, ...resourceMenu[1]],
        recycleMenu,
        tagMenu
      ],
      nodeInput: '',
      folderIndex: 1,
      selectedTags: [],
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
          children: []
        },
        {
          title: '回收站',
          link: 'recycle',
          type: 'recycle'
        }
      ],
      folderTree: new TreeStore([rootFolder])
    }
  },

  computed: {
    ...mapGetters({
      isDBReady: 'GET_DB_READY',
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      allTags: 'GET_ALL_TAGS'
    })
  },

  watch: {
    isDBReady (val) {
      let _self = this
      if (val) {
        ipcRenderer.send('fetch-local-data', {
          name: ['getAllLocalFolder'],
          from: 'NavBar'
        })
        ipcRenderer.on('fetch-local-data-response', (event, arg) => {
          if (arg.from === 'NavBar') {
            this.$worker.postMessage(['calcLocalData', arg.res[0]])
          }
        })
        // getAllLocalFolder().then(res => {
          // console.log('res', res)
          // this.$worker.postMessage(['calcLocalData', res])
        // })
        this.$worker.onmessage = function (e) {
          console.log('e', e)
          if (e.data !== 'Unknown command') {
            if (e.data[0] === 'calcLocalData') {
              console.log(e.data)
              let newRootFolder = e.data[1]
              _self.folderTree = new TreeStore([latestNav, newRootFolder, tagNav, binNav])
              _self.$nextTick(() => {
                _self.$refs.tree.$children[1].click()
                _self.SET_IS_HOME_READY(true)
              })
            }
          }
        }
      }
    },

    allTags (val) {
      console.log('allTags', val)
      this.updateTags(val)
    },

    selectedTags (val) {
      this.SET_VIEW_NAME(val.map(item => item.data.title).join('、'))
      this.SET_SELECTED_TAGS(val.map(item => item.data.id))
    }
  },

  mounted () {
    // const curNode = this.$refs.tree.store.currentNode
    // console.log('curNode', curNode)
    // if (curNode) {
    //   this.handleItemClick(curNode)
    // }
    // this.SET_TAGS_FROM_LOCAL()
    // LocalDAO.tag.getAll().then(res => {
    //   this.updateTags(res)
    // })
  },

  methods: {
    ...mapActions([
      'ADD_FILE',
      'DELETE_FILE',
      'EDIT_FILE',
      'APPEND_FILE',
      'MOVE_FILE',
      'DELETE_TAG',
      'CLEAR_ALL_RECYCLE',
      'RESUME_ALL_RECYCLE',
      'SET_VIEW_NAME',
      'SET_VIEW_FILE_TYPE',
      'SET_CURRENT_FOLDER',
      'TOGGLE_SHOW_MOVE_PANEL',
      'SET_TAGS_FROM_LOCAL',
      'SET_SELECTED_TAGS',
      'SET_CURRENT_NAV',
      'ADD_FILE',
      'SET_IS_HOME_READY'
    ]),

    handleSetCurrentFolder (node) {
      this.SET_CURRENT_NAV(node.data)
    },

    setCurrentFolder (id) {
      this.$refs.tree.select(id)
    },

    handleContextmenu (nodeInstance) {
      this.popupedNode = nodeInstance
      nodeInstance.click()
      const d = nodeInstance.model
      console.log('handleContextmenu-11', nodeInstance, nodeInstance.model)
      if (d.data.type === 'folder') {
        if (d.id === '0') {
          this.popupNativeMenu(this.nativeMenus[0])
        } else {
          const resourceMenu = !this.duplicatedNode
            ? this.nativeMenus[1]
            : this.nativeMenus[2]
          this.popupNativeMenu(resourceMenu)
        }
      } else {
        if (d.data.type === 'tagItem') {
          this.popupNativeMenu(this.nativeMenus[4])
        }
        if (d.data.type === 'bin') {
          this.popupNativeMenu(this.nativeMenus[3])
        }
      }
    },

    handleNewNote (isTemp) {
      console.log('handleNewNote', this.popupedNode)
      addLocalNote({
        title: '无标题笔记',
        pid: this.popupedNode.model.id,
        isTemp: isTemp
      }).then(res => {
        this.$hub.dispatchHub('addFile', this, res)
      })
    },

    handleNewTemplateNote () {
      this.handleNewNote(true)
    },

    handleNewFolder (isCurrent) {
      this.popupedNode.addChild({}, true)
    },

    handleAddNode (node) {
      addLocalFolder({
        title: node.name,
        pid: node.pid
      }).then(res => {
        node.id = res._id
        node.data = {
          id: res._id,
          type: 'folder'
        }
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
      this.popupedNode.setEditable()
    },

    handleChangeNodeName (node) {
      console.log('handleChangeNodeName', node)
      updateLocalFolder({
        id: node.id,
        title: node.name
      })
    },

    handleFolderUpdate (params) {
      this.$refs.tree.updateNodeModel(params)
    },

    handleNodeDrop ({node, oldParent}) {
      console.log('handleNodeDrop', node, oldParent, node.id, oldParent.id)
      if (node.pid !== oldParent.id) {
        console.log('move')
        updateLocalFolder({
          id: node.id,
          pid: node.pid
        })
      }
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
        let recycleNode = this.$refs.tree.store.root.childNodes[3]
        this.handleItemClick(recycleNode)
      })
    },

    handleDelete () {
      console.log('handleDelete', this.popupedNode)
      updateLocalFolder({
        id: this.popupedNode.model.id,
        trash: 'TRASH'
      }).then(res => {
        this.popupedNode.model.remove()
        this.setCurrentFolder('bin')
      })
    },

    handleClearRecycle () {
      this.CLEAR_ALL_RECYCLE()
      this.clickRecycleNode()
    },

    handleResumeRecycle () {
      this.RESUME_ALL_RECYCLE()
      this.clickRecycleNode()
    },

    handleDeleteTag () {
      console.log('handleDeleteTag', this.popupedNode)
      this.DELETE_TAG(this.popupedNode.data.id)
    },

    iconClassComputed (node) {
      let pre = ''
      if (node.data.type === 'folder') {
        pre = (node.expanded ? 'icon-folder_open' : 'icon-folder_close')
      } else {
        pre = `icon-${node.data.link}`
      }
      return `${pre} ${node.store.currentNode === node ? 'highlight' : ''}`
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
    },

    updateTags (allTags) {
      console.log('allTags', allTags)
      this.$set(
        this.nav[2],
        'children',
        allTags.map(item => {
          return {
            id: item._id,
            title: item.name,
            type: 'select'
          }
        })
      )
    },

    handleDragStart (node) {
      this.dragNode = node
    },

    handleDragEnd (e) {
      if (this.dragOverNode == null) return
      if (this.dragNode === this.dragOverNode) {
        this.dragOverNode.instance.toggleHightlight(false)
        this.dragOverNode.instance.toggleHightlightBottom(false)
        this.dragNode = null
        this.dragOverNode = null
        return
      }

      const nodeElRect = this.dragOverNode.instance.$el.getBoundingClientRect()

      let eventArea = {
        x: e.clientX,
        y: e.clientY
      }

      if (eventArea.y < nodeElRect.top + 40 * 0.2) {
        console.log('top')
        this.MOVE_FILE({
          fileId: this.dragNode.data.id,
          broId: this.dragOverNode.data.id,
          type: 'before'
        })
      } else if (eventArea.y > nodeElRect.top + 40 * 0.8) {
        console.log('bottom')
        this.MOVE_FILE({
          fileId: this.dragNode.data.id,
          broId: this.dragOverNode.data.id,
          type: 'after'
        })
      } else {
        if (this.dragNode.parent !== this.dragOverNode) {
          this.APPEND_FILE({
            fileId: this.dragNode.data.id,
            targetId: this.dragOverNode.data.id
          })
        }
      }

      this.dragOverNode.instance.toggleHightlight(false)
      this.dragOverNode.instance.toggleHightlightBottom(false)
      this.dragNode = null
      this.dragOverNode = null
    },

    handleDragOver (node, e) {
      if (node === this.dragNode) {
        this.dragOverNode && this.dragOverNode.instance.toggleHightlight(false)
        this.dragOverNode && this.dragOverNode.instance.toggleHightlightBottom(false)
        this.dragOverNode = null
        return
      }
      if (node.data.type !== 'folder') return
      this.dragOverNode = node
      const nodeElRect = node.instance.$el.getBoundingClientRect()
      
      let eventArea = {
        x: e.clientX,
        y: e.clientY
      }

      if (eventArea.y < nodeElRect.top + 40 * 0.2) {
        if (node.level === 1) return
        node.instance.toggleHightlightTop(true)
      } else if (eventArea.y > nodeElRect.top + 40 * 0.8) {
        if (node.expanded && node.childNodes.length > 0) return
        node.instance.toggleHightlightBottom(true)
      } else {
        node.instance.toggleHightlight(true)
      }
    },

    handleRefreshed () {
      // console.log('handleRefreshed')
      // if (this.typingNode) {
      //   for (let i in this.$refs.tree.store.nodeMap) {
      //     let nodeTemp = this.$refs.tree.store.nodeMap[i]
      //     if (nodeTemp.data.id === this.typingNode.data.id) {
      //       console.log('handleNodeInputBlur-11111', nodeTemp)
      //       this.handleItemClick(nodeTemp)
      //       this.typingNode = null
      //       return
      //     }
      //   }
      // }
    }
  }
}
</script>

<style lang="stylus" scoped>
#navbar
  position relative
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
    color #DDAF59
    & span:nth-of-type(1)
      display block
      transform scaleY(0.8)
  .click-mask
    position absolute
    width 100%
    height 100%
    padding 0 40px
  .dragover-mask
    position absolute
    top 0
    left 0
    width 100%
    height 80%
  .dragover-bottom-mask
    width 100%
    height 20%
    position absolute
    bottom 0
    left 0
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
    position relative
    width 70px !important
    height 60px
    background-repeat  no-repeat
    background-size 40%
    background-position center
    &.active
      background-color #313336
      &::after
        content ''
        display block
        position absolute
        right 0
        top 0
        width 2px
        height 100%
        background-color #DDAF59

.icon
  background-repeat  no-repeat
  background-size 100%
  background-position center
.icon-latest
  width 28px !important
  background-image url(../../../assets/images/lanhu/documents@2x.png)
  &.highlight
    background-image url(../../../assets/images/lanhu/documents_highlight@2x.png)
.icon-share
  background-image url(../../../assets/images/lanhu/normal@2x.png)
  &.highlight
    background-image url(../../../assets/images/lanhu/normal_highlight@2x.png)
.icon-folder_open
  background-image url(../../../assets/images/lanhu/folder_open@2x.png)
  &.highlight
    background-image url(../../../assets/images/lanhu/folder_open_highlight@2x.png)
.icon-folder_close
  background-image url(../../../assets/images/lanhu/folder_close@2x.png)
  &.highlight
    background-image url(../../../assets/images/lanhu/folder_close_highlight@2x.png)
.icon-tags
  background-image url(../../../assets/images/lanhu/tag@2x.png)
  &.highlight
    background-image url(../../../assets/images/lanhu/tag_highlight@2x.png)
.icon-recycle
  background-image url(../../../assets/images/lanhu/recycle@2x.png)
  &.highlight
    background-image url(../../../assets/images/lanhu/recycle_highlight@2x.png)
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

// .tree-node.is-selected
//   .icon-latest
//     background-image url(../../../assets/images/lanhu/documents_highlight@2x.png)
//   .icon-folder_open
//     background-image url(../../../assets/images/lanhu/folder_open_highlight@2x.png)
//   .icon-folder_close
//     background-image url(../../../assets/images/lanhu/folder_close_highlight@2x.png)
//   .icon-tags
//     background-image url(../../../assets/images/lanhu/tag_highlight@2x.png)
//   .icon-recycle
//     background-image url(../../../assets/images/lanhu/recycle_highlight@2x.png)
.push-mark
  position absolute
  top 10px
  left 10px
  width 4px
  height 4px
  background-color red
  border-radius 50%
  &.local
    left 0px
    background-color green
</style>
