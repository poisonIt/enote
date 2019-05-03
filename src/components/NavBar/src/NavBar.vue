<template>
  <div id="navbar" ref="navbar">
    <!-- <div class="nav-item nav-latest" @click="handleClickNavItem('latest')">最新文档</div>
    <div class="nav-item nav-share" @click="handleClickNavItem('share')">与我分享</div> -->
    <!-- <div class="folder-tree"> -->
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
    <!-- </div> -->
    <!-- <div class="nav-item nav-tag" @click="handleClickNavItem('tag')">标签</div>
    <div class="nav-item nav-bin" @click="handleClickNavItem('bin')">回收站</div> -->
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
      console.log('watch-isDBReady', val)
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
    const _self = this

    this.$root.$navTree = this.$refs.tree

    this.$worker.onmessage = function (e) {
      if (e.data !== 'Unknown command') {
        if (e.data[0] === 'calcLocalData') {
          let newRootFolder = e.data[1]
          // _self.folderTree = new TreeStore([newRootFolder])
          _self.folderTree = new TreeStore([latestNav, newRootFolder, tagNav, binNav])
          _self.$nextTick(() => {
            _self.$refs.tree.$children[0].click()
            _self.SET_IS_HOME_READY(true)
            ipcRenderer.send('show-home-window')
          })
        }
      }
    }

    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from === 'NavBar') {
        console.log('fetch-local-data-response', arg)
        if (arg.tasks.indexOf('getAllLocalFolder') > -1) {
          let res = arg.res[arg.tasks.indexOf('getAllLocalFolder')]
          this.$worker.postMessage(['calcLocalData', res])
        }
        if (arg.tasks.indexOf('addLocalFolder') > -1) {
          let res = arg.res[arg.tasks.indexOf('addLocalFolder')]
          this.popupedNode.addChild({
            id: arg.res[0]._id,
            type: 'folder'
          }, true)
        }
        if (arg.tasks.indexOf('addLocalNote') > -1) {
          let res = arg.res[arg.tasks.indexOf('addLocalNote')]
          this.$hub.dispatchHub('addFile', this, res)
        }
      }
    })

    ipcRenderer.send('home-window-ready')

    // ipcRenderer.send('fetch-local-data', {
    //   tasks: ['getAllLocalFolder'],
    //   from: 'NavBar'
    // })
  },

  methods: {
    ...mapActions([
      'ADD_FILE',
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

    // handleClickNavItem (navName) {
    //   this.setCurrentFolder(null)
    // },

    handleSetCurrentFolder (node) {
      console.log('handleSetCurrentFolder', node, node.data.type, node.getDepth())
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
      let nodeData = this.popupedNode.model.data
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalNote'],
        params: [{
          title: '无标题笔记',
          pid: nodeData.id || nodeData._id || '0',
          isTemp: isTemp
        }],
        from: 'NavBar'
      })
    },

    handleNewTemplateNote () {
      this.handleNewNote(true)
    },

    handleNewFolder (isCurrent) {
      let nodeData = this.popupedNode.model.data
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalFolder'],
        params: [{ pid: nodeData.id || nodeData._id || '0' }],
        from: 'NavBar'
      })
    },

    handleAddNode (node) {
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
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalFolder'],
        params: [{
          id: node.data._id || node.data.id || node.id,
          title: node.name
        }],
        from: 'NavBar'
      })
    },

    handleFolderUpdate (params) {
      this.$refs.tree.updateNodeModel(params)
    },

    handleNodeDrop ({node, oldParent}) {
      console.log('handleNodeDrop', node, oldParent, node.id, oldParent.id)
      if (node.pid !== oldParent.id) {
        console.log('move')
        ipcRenderer.send('fetch-local-data', {
          tasks: ['updateLocalFolder'],
          params: [{
            id: node.data._id || node.data.id || node.id,
            pid: node.pid
          }],
          from: 'NavBar'
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
    }
  }
}
</script>

<style lang="stylus" scoped>
#navbar
  position relative
  flex 1
  display flex
  flex-direction column
  padding-bottom 30px
  overflow-y scroll

.nav-item
  height 40px
  color #fff

.folder-tree
  flex 1
  overflow-y scroll
  position relative

.child
  background-color #fff

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
