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
      @set-current="handleSetCurrentFolder"
      @select="handleSelect"
      @add-node="handleNodeAdded"
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
import { mapActions, mapGetters } from 'vuex'
import {
  folderMenu,
  rootFolderMenu,
  resourceMenu,
  binMenu,
  tagMenu
} from '../Menu'
import fetchLocal from '../../../utils/fetchLocal'
import mixins from '../mixins'
import { Tree, TreeStore, TreeNode } from '@/components/Tree'

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
    })
  },

  watch: {
    isDBReady (val) {
      if (val) {
        fetchLocal('getLocalFolderByQuery', [
          { trash: 'NORMAL' },
          { trash: 'TRASH' }
        ],
        {
          multi: true
        }).then(folders => {
          fetchLocal('getAllLocalTag').then(tags => {
            this.$worker.postMessage(['calcLocalData', [folders, tags]])
          })
        })
      }
    }
  },

  mounted () {
    const _self = this

    this.$root.$navTree = this.$refs.tree

    this.$worker.onmessage = function (e) {
      if (e.data !== 'Unknown command') {
        if (e.data[0] === 'calcLocalData') {
          let newRootFolder = e.data[1]
          let newTagNav = e.data[2]
          _self.folderTree = new TreeStore([latestNav, newRootFolder, newTagNav, binNav])
          _self.$nextTick(() => {
            _self.$refs.tree.$children[0].click()
            _self.SET_IS_HOME_READY(true)
            // ipcRenderer.send('show-home-window')
          })
        }
      }
    }

    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from[0] === 'NavBar') {
        console.log('fetch-local-data-response', arg)
        // if (arg.tasks[0] === 'getAllLocalFolder' && arg.tasks[1] === 'getAllLocalTag') {
        //   this.$worker.postMessage(['calcLocalData', arg.res])
        // }

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
      }
    })
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
      this.SET_CURRENT_NAV(node.data)
    },

    handleSelect (node) {
      this.TOGGLE_SELECTED_TAG({
        id: node.data._id
      })
    },

    setCurrentFolder (id) {
      this.$refs.tree.select(id)
    },

    handleContextmenu (nodeInstance) {
      this.popupedNode = nodeInstance
      const d = nodeInstance.model
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

      fetchLocal('addLocalNote', {
        title: '无标题笔记',
        pid: currentNode.id || currentNode._id || currentNode.data._id || '0',
        isTemp: isTemp
      }).then(res => {
        console.log('addLocalNote', res)
        this.$hub.dispatchHub('addFile', this, res)
      })
    },

    handleNewTemplateNote () {
      this.handleNewNote(true)
    },

    handleNewFolder (isCurrent, nodeId) {
      let node
      let nodeData
      if (nodeId) {
        let map = this.$refs.tree.model.store.map
        nodeData = map[nodeId]
        node = nodeData.instance
      } else {
        if (isCurrent) {
          let currentNode = this.$refs.tree.model.store.currentNode.instance
          if (!currentNode.model.parent.parent && currentNode.id !== '0') {
            return
          }
          node = currentNode
        } else {
          node = this.popupedNode
        }
        nodeData = node.model.data
      }

      fetchLocal('addLocalFolder', {
        pid: nodeData.id || nodeData._id || '0'
      }).then(res => {
        node.addChild({
          id: res._id,
          type: 'folder'
        })
      })
    },

    handleNodeAdded (node) {
      this.$nextTick(() => {
        if (node.instance) {
          node.instance.setEditable()
        }
      })
    },

    handleAddTagNode (tagData) {
      console.log('handleAddTagNode', tagData)
      let tagRootNode = this.$refs.tree.model.store.root.children[2]
      let tag = {}
      tag.type = 'select'
      tag.isSelected = false
      tag.dragDisabled = true
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
      if (node.type === 'select') {
        fetchLocal('updateLocalTag', {
          id: node.data._id || node.data.id || node.id,
          name: node.name
        }).then(res => {
          if (res.name !== node.name) {
            node.name = res.name
            node.data.name = res.name
          } else {
            this.TOGGLE_SHOW_TAG_HANDLER(false)
          }
        })
      } else {
        fetchLocal('updateLocalFolder', {
          id: node.data._id || node.data.id || node.id,
          title: node.name
        }).then(res => {
          if (node.parent === this.$refs.tree.model.store.currentNode) {
            this.$hub.dispatchHub('renameListFile', this, {
              id: node.model.data._id,
              title: node.model.name
            })
          }
        })
      }
    },

    handleFolderUpdate (params) {
      console.log('handleFolderUpdate', params)
      this.$refs.tree.updateNodeModel(params)
    },

    handleNodeDrop ({node, oldParent}) {
      if (node.pid !== oldParent.id) {
        fetchLocal('updateLocalFolder', {
          id: node.data._id || node.data.id || node.id,
          pid: node.pid
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
    },

    handleDuplicate () {
      this.SET_DUPLICATE_FILE(this.copyFile(this.popupedNode.model.data))
    },

    handlePaste () {
      let data = this.popupedNode.model.data
      let pid = data.id || data._id
      let shouldUpdateList = (this.popupedNode.model === this.$refs.tree.model.store.currentNode)

      if (this.duplicateFile.type === 'note') {
        fetchLocal('duplicateLocalNote', {
          id: this.duplicateFile._id,
          pid: pid
        }).then(res => {
          let fileTypeCN = res.type === 'folder' ? '文件夹' : '笔记'
          this.$Message.success({
            content: `复制了${fileTypeCN} ${res.title} 至目录 ${data.title}！`
          })
          this.$hub.dispatchHub('setSelectFileId', this, res._id)
          if (shouldUpdateList) {
            this.$hub.dispatchHub('refreshList', this)
          } else {
            this.setCurrentFolder(pid)
          }
        })
      }
    },

    handleDelete () {
      let node = this.popupedNode.model

      fetchLocal('updateLocalFolder', {
        id: node.data._id || node.data.id || node.id,
        trash: 'TRASH'
      }).then(res => {
        node.hidden = true
        this.setCurrentFolder('bin')
      })
    },

    handleClearBin () {
      let node = this.popupedNode.model

      fetchLocal('deleteAllTrash').then(res => {
        this.$hub.dispatchHub('refreshList', this)
        let nodes = res.filter(item => item.type === 'folder')
        let map = this.$refs.tree.model.store.map
        nodes.forEach(node => {
          map[node._id].remove()
        })
      })
    },

    handleResumeBin () {
      fetchLocal('resumeAllTrash').then(res => {
        this.$hub.dispatchHub('refreshList', this)
        let nodes = res.filter(item => item.type === 'folder')
        let map = this.$refs.tree.model.store.map
        nodes.forEach(node => {
          this.$set(map[node._id], 'hidden', false)
        })
      })
    },

    handleRenameTag () {
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
