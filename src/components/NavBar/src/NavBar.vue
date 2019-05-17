<template>
  <div id="navbar" ref="navbar">
    <Tree
      ref="tree"
      :dark="true"
      :model="folderTree"
      default-tree-node-name="新建文件夹"
      v-bind:default-expanded="true"
      :flat-ids="['0', 'latest', 'share', 'tag', 'bin']"
      @contextmenu="handleContextmenu"
      @add-node="handleAddNode"
      @set-current="handleSetCurrentFolder"
      @select="handleSelect"
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
  binMenu,
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
        binMenu,
        tagMenu
      ],
      nodeInput: '',
      folderIndex: 1,
      // selectedTags: [],
      folderTree: new TreeStore([rootFolder])
    }
  },

  computed: {
    ...mapGetters({
      isDBReady: 'GET_DB_READY',
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      currentFile: 'GET_CURRENT_FILE',
      duplicateFile: 'GET_DUPLICATE_FILE'
      // allTags: 'GET_ALL_TAGS'
    })
  },

  watch: {
    isDBReady (val) {
      console.log('watch-isDBReady', val)
    },

    // allTags (val) {
    //   console.log('allTags', val)
    //   this.updateTags(val)
    // },

    // selectedTags (val) {
      // this.SET_VIEW_NAME(val.map(item => item.data.title).join('、'))
      // this.SET_SELECTED_TAGS(val.map(item => item.data.id))
    // }
  },

  mounted () {
    const _self = this

    this.$root.$navTree = this.$refs.tree

    this.$worker.onmessage = function (e) {
      if (e.data !== 'Unknown command') {
        if (e.data[0] === 'calcLocalData') {
          let newRootFolder = e.data[1]
          let newTagNav = e.data[2]
          // _self.folderTree = new TreeStore([newRootFolder])
          _self.folderTree = new TreeStore([latestNav, newRootFolder, newTagNav, binNav])
          _self.$nextTick(() => {
            _self.$refs.tree.$children[0].click()
            _self.SET_IS_HOME_READY(true)
            ipcRenderer.send('show-home-window')
          })
        }
      }
    }

    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from[0] === 'NavBar') {
        console.log('fetch-local-data-response', arg)
        if (arg.tasks[0] === 'getAllLocalFolder' && arg.tasks[1] === 'getAllLocalTag') {
          this.$worker.postMessage(['calcLocalData', arg.res])
        }

        // add folder
        if (arg.tasks.indexOf('addLocalFolder') > -1) {
          let res = arg.res[arg.tasks.indexOf('addLocalFolder')]
          console.log('aaa', this.popupedNode)
          this.popupedNode.addChild({
            id: arg.res[0]._id,
            type: 'folder'
          }, true)
          this.$hub.dispatchHub('pushData', this)
        }

        // add note
        if (arg.tasks.indexOf('addLocalNote') > -1) {
          let res = arg.res[arg.tasks.indexOf('addLocalNote')]
          this.$hub.dispatchHub('addFile', this, res)
          this.$hub.dispatchHub('pushData', this)
        }

        // update folder
        if (arg.tasks.indexOf('updateLocalFolder') > -1) {
          if (arg.from[1] === 'delete') {
            this.popupedNode.model.hidden = true
            this.setCurrentFolder('bin')
          }
          if (arg.from[1] === 'renameFolder') {
            if (this.popupedNode.model.parent === this.$refs.tree.model.store.currentNode) {
              this.$hub.dispatchHub('renameListFile', this, {
                id: this.popupedNode.model.data._id,
                title: this.popupedNode.model.name
              })
            }
          }
          this.$hub.dispatchHub('pushData', this)
        }

        // update tag
        if (arg.tasks.indexOf('updateLocalTag') > -1) {
          if (arg.from[1] === 'renameTag') {
            console.log('renameTag', this.popupedNode.model, this.$refs.tree)
            if (arg.res[0].name !== this.popupedNode.model.name) {
              this.popupedNode.model.name = arg.res[0].name
              this.popupedNode.model.data.name = arg.res[0].name
            } else {
              this.TOGGLE_SHOW_TAG_HANDLER(false)
            }
          }
          this.$hub.dispatchHub('pushData', this)
        }

        if (arg.tasks.indexOf('deleteAllTrash') > -1) {
          if (arg.from[1] === 'clearBin') {
            this.setCurrentFolder('bin')
            ipcRenderer.send('fetch-local-data', {
              tasks: ['getLocalTrashFolder', 'getLocalTrashNote'],
              from: 'DocumentList',
            })
            if (arg.res[arg.tasks.indexOf('deleteAllTrash')]) {
              let nodes = arg.res[arg.tasks.indexOf('deleteAllTrash')]
                .filter(item => item.type === 'folder')
              let map = this.$refs.tree.model.store.map
              nodes.forEach(node => {
                map[node._id].remove()
              })
            }
          }
          this.$hub.dispatchHub('pushData', this)
        }

        if (arg.tasks.indexOf('resumeAllTrash') > -1) {
          if (arg.from[1] === 'resumeBin') {
            this.setCurrentFolder('bin')
            ipcRenderer.send('fetch-local-data', {
              tasks: ['getLocalTrashFolder', 'getLocalTrashNote'],
              from: 'DocumentList',
            })
            let nodes = arg.res[arg.tasks.indexOf('resumeAllTrash')]
              .filter(item => item.type === 'folder')
            let map = this.$refs.tree.model.store.map
            nodes.forEach(node => {
              map[node._id].hidden = false
            })
          }
          this.$hub.dispatchHub('pushData', this)
        }
      }
    })

    ipcRenderer.send('home-window-ready')
  },

  methods: {
    ...mapActions([
      'TOGGLE_SELECTED_TAG',
      'SET_VIEW_NAME',
      'SET_VIEW_FILE_TYPE',
      'SET_CURRENT_NAV',
      'SET_IS_HOME_READY',
      'SET_DUPLICATE_FILE',
      'TOGGLE_SHOW_MOVE_PANEL',
      'TOGGLE_SHOW_TAG_HANDLER'
    ]),

    handleSetCurrentFolder (node) {
      console.log('handleSetCurrentFolder', node)
      this.SET_CURRENT_NAV(node.data)
    },

    handleSelect (node) {
      console.log('handleSelect', node)
      this.TOGGLE_SELECTED_TAG({
        id: node.data._id
      })
    },

    setCurrentFolder (id) {
      this.$refs.tree.select(id)
    },

    handleContextmenu (nodeInstance) {
      this.popupedNode = nodeInstance
      // nodeInstance.click()
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
        if (d.data.type === 'select') {
          this.popupNativeMenu(this.nativeMenus[4])
        }
        if (d.data.type === 'bin') {
          this.popupNativeMenu(this.nativeMenus[3])
        }
      }
    },

    handleNewNote (isTemp) {
      let currentNode = this.$refs.tree.model.store.currentNode
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalNote'],
        params: [{
          title: '无标题笔记',
          pid: currentNode.id || currentNode._id || currentNode.data._id || '0',
          isTemp: isTemp
        }],
        from: ['NavBar']
      })
    },

    handleNewTemplateNote () {
      this.handleNewNote(true)
    },

    handleNewFolder (isCurrent) {
      if (isCurrent) {
        let currentNode = this.$refs.tree.model.store.currentNode.instance
        if (!currentNode.model.parent.parent && currentNode.id !== '0') {
          return
        }
        this.popupedNode = currentNode
      }
      let nodeData = this.popupedNode.model.data
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalFolder'],
        params: [{ pid: nodeData.id || nodeData._id || '0' }],
        from: ['NavBar']
      })
    },

    handleAddNode (node) {
    },

    handleAddTagNode (tagData) {
      console.log('handleAddTagNode', tagData)
      let tagRootNode = this.$refs.tree.model.store.root.children[2]
      let tag = {}
      tag.type = 'select'
      tag.isSelected = false
      tag.data = {
        type: 'select',
        name: tagData.name,
        _id: tagData._id,
        remote_id: tagData.remote_id
      }
      console.log('handleAddTagNode-tag', tag)
      tagRootNode.instance.addChild(tag)
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
      if (node.type === 'select') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['updateLocalTag'],
          params: [{
            id: node.data._id || node.data.id || node.id,
            name: node.name
          }],
          from: ['NavBar', 'renameTag']
        })
      } else {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['updateLocalFolder'],
          params: [{
            id: node.data._id || node.data.id || node.id,
            title: node.name
          }],
          from: ['NavBar', 'renameFolder']
        })
      }
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
          from: ['NavBar']
        })
      }
    },

    handleMove () {
      this.$hub.dispatchHub('showMovePanel', this, {
        file: {
          type: this.popupedNode.model.data.type,
          id: this.popupedNode.model.id,
          title: this.popupedNode.model.name
        },
        tree: this.$refs.tree.model.children[1]
      })
      // this.TOGGLE_SHOW_MOVE_PANEL(this.popupedNode.model.data._id)
    },

    handleDuplicate () {
      this.SET_DUPLICATE_FILE(this.copyFile(this.popupedNode.model.data))
    },

    handlePaste () {
      console.log('handlePaste', this.duplicateFile, this.popupedNode.model.data)
      if (this.duplicateFile.type === 'note') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['duplicateLocalNote'],
          params: [{
            id: this.duplicateFile._id,
            pid: this.popupedNode.model.data.id || this.popupedNode.model.data._id
          }],
          from: ['DocumentList', 'duplicate', this.duplicateFile._id]
        })
      }
    },

    handleDelete () {
      console.log('handleDelete', this.popupedNode)
      let node = this.popupedNode.model
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalFolder'],
        params: [{
          id: node.data._id || node.data.id || node.id,
          trash: 'TRASH'
        }],
        from: ['NavBar', 'delete']
      })
    },

    handleClearBin () {
      console.log('clearBin')
      ipcRenderer.send('fetch-local-data', {
        tasks: ['deleteAllTrash'],
        from: ['NavBar', 'clearBin']
      })
    },

    handleResumeBin () {
      console.log('handleResumeBin')
      ipcRenderer.send('fetch-local-data', {
        tasks: ['resumeAllTrash'],
        from: ['NavBar', 'resumeBin']
      })
    },

    handleRenameTag () {
      console.log('handleRenameTag', this.popupedNode)
      this.popupedNode.setEditable()
    },

    handleDeleteTag () {
      console.log('handleDeleteTag', this.popupedNode)
      // if (this.popupedNode.data.remote_id) {
      //   ipcRenderer.send('fetch-local-data', {
      //     tasks: ['updateLocalTag'],
      //     params: [{
      //       id: node.data._id || node.data.id || node.id,
      //       trash: 'DELETED'
      //     }],
      //     from: ['NavBar', 'deleteTag']
      //   })
      // } else {
      //   ipcRenderer.send('fetch-local-data', {
      //     tasks: ['deleteLocalTag'],
      //     params: [{
      //       id: node.data._id || node.data.id || node.id,
      //       trash: 'DELETED'
      //     }],
      //     from: ['NavBar', 'deleteTag']
      //   })
      // }
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

    copyFile (file) {
      return {
        type: file.type,
        title: file.title,
        create_at: file.create_at,
        folder_title: file.folder_title,
        need_push: file.need_push,
        pid: file.pid,
        remote_id: file.remote_id,
        remote_pid: file.remote_pid,
        seq: file.seq,
        trash: file.trash,
        update_at: file.update_at,
        _id: file._id
      }
    }

    // updateTags (allTags) {
    //   console.log('allTags', allTags)
    //   this.$set(
    //     this.nav[2],
    //     'children',
    //     allTags.map(item => {
    //       return {
    //         id: item._id,
    //         title: item.name,
    //         type: 'select'
    //       }
    //     })
    //   )
    // }
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
