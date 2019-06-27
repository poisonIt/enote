<template>
  <div id="navbar" ref="navbar">
    <Tree
      :class="{ 'unexpanded' : viewType !== 'expanded' }"
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
      @before-drop="handleBeforeNodeDrop"
      @drop="handleNodeDrop"
      @drop-fail="handleNodeDropFailed">
    </Tree>
    <div class="nav-mini" v-show="viewType === 'unexpanded'">
      <div class="icon icon-latest"
        :class="{
          active : navMiniActive('latest')
        }"
        @click="handleClickMini('latest')">
      </div>
      <div class="icon icon-share"
        :class="{
          active : navMiniActive(['share'])
        }"
        @click="handleClickMini('share')">
      </div>
      <div class="icon icon-folder_open"
        :class="{
          active : navMiniActive('folder'),
        }"
        @click="handleClickMini('0')">
      </div>
      <div class="icon icon-tag"
        :class="{
          active : navMiniActive('tag')
        }"
        @click="handleClickMini('tag')">
      </div>
      <div class="icon icon-bin"
        :class="{
          active : navMiniActive('bin')
        }"
        @click="handleClickMini('bin')">
      </div>
    </div>
    <modal
      :visible.sync="isDelConfirmShowed"
      width="300px"
      height="90px"
      top="30vh"
      style="padding-bottom:20px "
      transition-name="fade-in-down"
      @close="closeDelConfirm"
      title="删除确认">
        <div slot="header"><span>  </span></div>
        <div style="text-align:center;padding:10px; 0">
          <p>该文件夹下内容不为空，是否继续删除?</p>
        </div>
        <div class="button-group button-container" slot="footer">
          <div class="button primary" @click="delConfirm">确认删除</div>
          <div class="button" @click="closeDelConfirm">取消</div>
        </div>
    </modal>
    <modal
      :visible.sync="isRenameConfirmShowed"
      width="300px"
      height="90px"
      top="30vh"
      style="padding-bottom:20px "
      transition-name="fade-in-down"
      @close="cancelRename"
      title="重命名">
        <div style="text-align:center;padding:10px; 0">
          <p>目录中有重名文件夹，是否重命名为：{{ newTitle }}？</p>
        </div>
        <div class="button-group button-container" slot="footer">
          <div class="button primary" @click="confirmRename">是</div>
          <div class="button" @click="cancelRename">否</div>
        </div>
    </modal>
  </div>
</template>

<script>
import * as _ from 'lodash'
import pReduce from 'p-reduce'
import { mapActions, mapGetters } from 'vuex'
import {
  folderMenu,
  rootFolderMenu,
  resourceMenu,
  binMenu,
  tagMenu
} from '../Menu'
import fetchLocal from '../../../utils/fetchLocal'
import { handleNameConflict } from '../../../utils/utils'
import mixins from '../mixins'
import { Tree, TreeStore } from '@/components/Tree'

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

const shareNav = {
  name: '与我分享',
  id: 'share',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'share'
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
      newTitle: '',
      isDelConfirmShowed: false,
      isRenameConfirmShowed: false,
      renameNode: null,
      initFlag: true,
      typingNode: null,
      currentNode: null,
      popupedNode: null,
      duplicatedNode: null,
      dragNode: null,
      dropNode: null,
      oldParent: null,
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
      currentNav: 'GET_CURRENT_NAV',
      currentFile: 'GET_CURRENT_FILE',
      duplicateFile: 'GET_DUPLICATE_FILE',
      selectedTags: 'GET_SELECTED_TAGS',
      isTagShowed: 'GET_SHOW_TAG_HANDLER',
      draggingFile: 'GET_DRAGGING_FILE'
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
          sort: { seq: 1 },
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
          _self.folderTree = new TreeStore([latestNav, shareNav, newRootFolder, newTagNav, binNav])
          _self.$nextTick(() => {
            _self.$refs.tree.$children[0].click()
            setTimeout(() => {
              _self.SET_IS_HOME_READY(true)
            }, 300)
          })
        }
      }
    }
  },

  methods: {
    ...mapActions([
      'TOGGLE_SELECTED_TAG',
      'SET_VIEW_NAME',
      'SET_VIEW_FILE_TYPE',
      'SET_CURRENT_NAV',
      'SET_IS_HOME_READY',
      'SET_DUPLICATE_FILE',
      'SET_DRAGGING_FILE',
      'TOGGLE_SHOW_MOVE_PANEL',
      'TOGGLE_SHOW_TAG_HANDLER'
    ]),

    handleSetCurrentFolder (node) {
      this.SET_CURRENT_NAV(_.clone(node.data))
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
      let s = false
      let currentNode = this.$refs.tree.model.store.currentNode
      if (!currentNode.parent.parent && currentNode.id !== '0') {
        currentNode = this.$refs.tree.model.store.map['0']
        s = true
      }

      fetchLocal('addLocalNote', {
        title: '无标题笔记',
        pid: currentNode.id || currentNode._id || currentNode.data._id || '0',
        isTemp: isTemp
      }).then(res => {
        this.$hub.dispatchHub('addFile', this, res)
        if (s) {
          this.setCurrentFolder('0')
        }
        this.$hub.dispatchHub('pushData', this)
      })
    },

    handleNewTemplateNote () {
      this.handleNewNote(true)
    },

    handleNewFolder (isCurrent, nodeId) {
      let node
      let nodeData
      let map = this.$refs.tree.model.store.map
      if (nodeId) {
        nodeData = map[nodeId]
        node = nodeData.instance
      } else {
        if (isCurrent) {
          let currentNode = this.$refs.tree.model.store.currentNode.instance
          if (!currentNode.model.parent.parent && currentNode.id !== '0') {
            node = map['0'].instance
          } else {
            node = currentNode
          }
        } else {
          node = this.popupedNode
        }
        nodeData = node.model.data
      }

      node.addChild({
        id: null,
        type: 'folder',
        name: '新建文件夹',
        data: {
          type: 'folder',
          id: null,
          _id: null,
          pid: nodeData.id || nodeData._id || '0',
          title: '新建文件夹',
          name: '新建文件夹',
          seq: node.model.children.length,
          depth: node.model.getDepth()
        }
      })
    },

    async addFolder (node) {
      let res = await fetchLocal('addLocalFolder', {
        title: node.name,
        pid: node.data.pid,
        seq: node.data.seq,
        depth: node.data.depth
      })
      let map = this.$refs.tree.model.store.map
      delete map[node.id]
      res.name = res.title
      res.id = res._id
      node.data = res
      node.id = res._id
      node.name = res.title
      map[node.id] = node
      this.$hub.dispatchHub('pushData', this)
    },

    handleNodeAdded (node) {
      this.$nextTick(() => {
        if (node.instance) {
          node.instance.setEditable()
        }
      })
    },

    handleAddTagNode (tagData) {
      let tagRootNode = this.$refs.tree.model.store.root.children[3]
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
          if (!res) {
            node.name = node.data.name
          } else {
            if (res.name !== node.data.name) {
              node.name = res.name
              node.data.name = res.name
            } else {
              if (this.isTagShowed) {
                this.TOGGLE_SHOW_TAG_HANDLER(false)
                this.$nextTick(() => {
                  this.TOGGLE_SHOW_TAG_HANDLER(true)
                })
              }
            }
          }
          this.$hub.dispatchHub('pushData', this)
        })
      } else {
        fetchLocal('getLocalFolderByPid', {
          pid: node.data.pid
        }).then(folders => {
          let titles = folders.map(item => item.title)
          if (titles.indexOf(node.name) > -1) {
            this.newTitle = handleNameConflict(node.name, node.data.title, titles)
            this.isRenameConfirmShowed = true
            this.renameNode = node
          } else {
            this.newTitle = node.name
            this.updateFolderName(node)
          }
        })
      }
    },

    updateFolderName (node) {
      if (node.data.id === null) { // 新建文件夹
        node.data.title = node.data.name = node.name = this.newTitle
        this.addFolder(node)
        return
      }
      fetchLocal('updateLocalFolder', {
        id: node.data._id || node.data.id || node.id,
        title: this.newTitle
      }).then(res => {
        node.name = node.data.title = this.newTitle
        if (node.parent === this.$refs.tree.model.store.currentNode) {
          this.$hub.dispatchHub('renameListFile', this, {
            id: node.model.data._id,
            title: this.newTitle
          })
        }
        this.$hub.dispatchHub('pushData', this)
      })
    },

    confirmRename () {
      if (this.draggingFile) {
        if (this.draggingFile.type === 'note') {
          this.moveNote({
            id: this.draggingFile._id,
            pid: this.dropNode.id,
            title: this.newTitle
          })
        } else if (this.draggingFile.type === 'folder') {
          this.moveFolder({
            id: this.draggingFile._id,
            pid: this.dropNode.id,
            title: this.newTitle
          })
        }

        this.isRenameConfirmShowed = false
        return
      }

      if (this.dragNode) {
        if (this.dragNode.data.type === 'folder') {
          this.dragNode.name = this.dragNode.data.title = this.newTitle
          this.dropNode.instance.handleDrop(this.dragNode, this.oldParent)
          this.moveFolder({
            id: this.dragNode.id,
            pid: this.dropNode.id,
            title: this.newTitle
          })
        }

        this.isRenameConfirmShowed = false
        return
      }

      if (this.duplicateFile) {
        let temp = _.cloneDeep(this.duplicateFile)
        temp.title = this.newTitle
        this.SET_DUPLICATE_FILE(temp)
        this.isRenameConfirmShowed = false
        this.handlePaste()
        return
      }

      this.updateFolderName(this.renameNode)
      this.isRenameConfirmShowed = false
    },

    cancelRename () {
      if (this.dragNode) {
        this.dropNode.instance.dragLeave()
        this.dragNode = null
        this.dropNode = null
        this.oldParent = null
        this.newTitle = ''
        this.handleNodeDropFailed()
      }
      if (this.renameNode) {
        if (this.renameNode.data.id === null) {
          this.renameNode.remove()
          this.popupedNode && this.popupedNode.click()
        } else {
          this.renameNode.name = this.renameNode.data.title
        }
        this.renameNode = null
      }
      this.isRenameConfirmShowed = false
    },

    handleFolderUpdate (params) {
      this.$refs.tree.updateNodeModel(params)
    },

    async handleBeforeNodeDrop ({ target, to, from, next }) {
      if (target.name === 'root' || target === to || target.isTargetChild(to)) {
        this.handleNodeDropFailed()
        to.instance.dragLeave()
        return
      }
      this.dragNode = target
      this.oldParent = from
      this.dropNode = to

      let isNameConflict = await this.checkNameConflict(to.data._id, target.name, target.data.title, 'folder')
      if (isNameConflict) {
        return
      }

      this.moveFolder({
        id: target.id,
        pid: to.id
      }).then(() => {
        next(target, from)
      })
    },

    handleNodeDropFailed () {
      this.$Message.error('移动失败')
    },

    async handleNodeDrop ({ node, oldParent }) {
      if (node.data.type !== 'folder') return

      let oldBrothers = []

      let newBrothers = []

      let titleArr = []

      // 拖动fileCard
      if (!oldParent && this.draggingFile) {
        this.dropNode = node
        let taskName = this.draggingFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
        if (this.draggingFile.type === 'folder') {
          node.instance.moveNode(this.draggingFile)
          return
        }

        let isNameConflict = await this.checkNameConflict(node.id, this.draggingFile.title, this.draggingFile.title, 'note')
        if (isNameConflict) {
          return
        }

        this.moveNote({
          id: this.draggingFile._id,
          pid: this.dropNode.id
        })
      }
    },

    async moveNote (params) {
      let updateRes = await fetchLocal('updateLocalNote', params)

      this.$hub.dispatchHub('refreshList', this)
      this.$Message.success({
        content: `移动了笔记 ${updateRes.title} 至目录 ${this.dropNode.name}！`
      })

      this.SET_DRAGGING_FILE(null)
      this.dragNode = null
      this.dropNode = null
      this.oldParent = null
      this.newTitle = ''
      this.isRenameConfirmShowed = false
      this.$hub.dispatchHub('pushData', this)
    },

    async moveFolder (params) {
      let map = this.$refs.tree.model.store.map

      let updateRes = await fetchLocal('updateLocalFolder', params)

      let oldBrothers = await fetchLocal('getLocalFolderByPid', {
        pid: this.oldParent.id
      })

      let newBrothers = await fetchLocal('getLocalFolderByPid', {
        pid: this.dropNode.id
      })

      let nodes = [...oldBrothers, ...newBrothers]

      let p = nodes.map(folder => {
        let node = map[folder._id]
        return fetchLocal('updateLocalFolder', {
          id: node.data._id || node.data.id || node.id,
          seq: node.getIndex()
        })
      })

      await Promise.all(p)
      let curNode = this.$refs.tree.model.store.currentNode
      curNode.data._id = curNode.data._id || '0'
      if (curNode.data._id === this.oldParent.id || curNode.data._id === this.dropNode.id) {
        this.$hub.dispatchHub('refreshList', this)
      }
      this.$Message.success({
        content: `移动了文件夹 ${updateRes.title} 至目录 ${this.dropNode.name}！`
      })

      this.SET_DRAGGING_FILE(null)
      this.dragNode = null
      this.dropNode = null
      this.oldParent = null
      this.newTitle = ''
      this.$hub.dispatchHub('pushData', this)
    },

    handleMove () {
      this.$hub.dispatchHub('showMovePanel', this, {
        file: {
          type: this.popupedNode.model.data.type,
          id: this.popupedNode.model.id,
          title: this.popupedNode.model.name
        },
        tree: this.$refs.tree.model.children[2]
      })
    },

    handleDuplicate () {
      this.SET_DUPLICATE_FILE(this.copyFile(this.popupedNode.model.data))
    },

    async handlePaste () {
      let node = this.popupedNode.model
      let data = node.data
      let pid = data.id || data._id
      let shouldUpdateList = (this.popupedNode.model === this.$refs.tree.model.store.currentNode)

      if (this.duplicateFile.type === 'note') {
        let isNameConflict = await this.checkNameConflict(pid, this.duplicateFile.title, this.duplicateFile.title, 'note')
        if (isNameConflict) {
          return
        }

        fetchLocal('duplicateLocalNote', {
          id: this.duplicateFile._id,
          title: this.duplicateFile.title,
          pid: pid
        }).then(res => {
          this.duplicateFile = null
          this.newTitle = ''
          let fileTypeCN = res.type === 'folder' ? '文件夹' : '笔记'
          this.$Message.success({
            content: `复制了${fileTypeCN} ${res.title} 至目录 ${node.name}！`
          })
          this.$hub.dispatchHub('setSelectFileId', this, res._id)
          if (shouldUpdateList) {
            this.$hub.dispatchHub('refreshList', this)
          } else {
            this.setCurrentFolder(pid)
          }
          this.$hub.dispatchHub('pushData', this)
        })
      }
    },

    handleDelete () {
      let node = this.popupedNode.model
      let params = {
        pid: node.data._id || node.data.id || node.id
      }

      fetchLocal('getLocalFolderByPid', params).then(folders => {
        fetchLocal('getLocalNoteByPid', params).then(notes => {
          let files = [...folders, ...notes].filter(file => file.trash === 'NORMAL')
          if (files.length === 0) {
            this.delNode(node)
          } else {
            this.isDelConfirmShowed = true
          }
        })
      })
    },

    delConfirm () {
      let node = this.popupedNode.model
      this.delNode(node)
      this.isDelConfirmShowed = false
    },

    delNode (node) {
      fetchLocal('updateLocalFolder', {
        id: node.data._id || node.data.id || node.id,
        trash: 'TRASH'
      }).then(res => {
        node.hidden = true
        this.setCurrentFolder('bin')
        this.$hub.dispatchHub('pushData', this)
      })
    },

    closeDelConfirm () {
      this.isDelConfirmShowed = false
    },

    handleClearBin () {
      fetchLocal('deleteAllTrash').then(res => {
        this.$hub.dispatchHub('refreshList', this)
        let nodes = res.filter(item => item.type === 'folder')
        let map = this.$refs.tree.model.store.map
        nodes.forEach(node => {
          map[node._id].remove()
        })
        this.$hub.dispatchHub('pushData', this)
      })
    },

    handleResumeBin () {
      this.resumeAllTrash().then(res => {
        this.$hub.dispatchHub('refreshList', this)
        let nodes = res.filter(item => item.type === 'folder')
        let map = this.$refs.tree.model.store.map
        nodes.forEach(node => {
          this.$set(map[node._id], 'hidden', false)
          this.$set(map[node._id], 'name', node.title)
        })
        this.$hub.dispatchHub('pushData', this)
      })
    },

    async resumeAllTrash () {
      let folderMap = this.$refs.tree.model.store.map
      let trashFolders = await fetchLocal('getLocalTrashFolder')
      let trashNotes = await fetchLocal('getLocalTrashNote')

      trashFolders.forEach(folder => {
        folder.depth = folderMap[folder._id] ? folderMap[folder._id].getDepth() : 0
      })
      trashFolders.sort((a, b) => a.depth - b.depth)

      let files = [...trashFolders, ...trashNotes]

      let p = files.map((file, idx) => {
        return this.createResumeP(file, idx)
      })

      let result = []
      result = await pReduce(p, async (a, b) => {
        return a.concat([b])
      }, [])

      return result

      // return await Promise.all(p)
    },

    createResumeP (file, idx) {
      let folderMap = this.$refs.tree.model.store.map
      return new Promise((resolve, reject) => {
        let newTitle = file.title
        let taskName = file.type === 'folder'
          ? 'updateLocalFolder'
          : 'updateLocalNote'

        let pTaskName = file.type === 'folder'
          ? 'getLocalFolderByPid'
          : 'getLocalNoteByPid'
        setTimeout(() => {
          fetchLocal(pTaskName, {
            pid: file.pid
          }).then(newBrothers => {
            newBrothers = newBrothers.filter(item => item.trash === 'NORMAL')

            let titleArr = newBrothers.map(item => item.title)

            if (titleArr.indexOf(newTitle) > -1) {
              newTitle = handleNameConflict(
                file.title,
                file.title,
                titleArr
              )
            }
            fetchLocal(taskName, {
              id: file._id,
              title: newTitle,
              trash: 'NORMAL'
            }).then(res => {
              resolve(res)
            })
          })
        }, 30 * idx)
      })
    },

    handleRenameTag () {
      this.popupedNode.setEditable()
    },

    handleDeleteTag () {
      let node = this.popupedNode.model
      let id = node.data._id || node.data.id || node.id
      fetchLocal('updateLocalTag', {
        id: id,
        trash: 'DELETED'
      }).then(res => {
        if (this.selectedTags.indexOf(id) > -1) {
          this.TOGGLE_SELECTED_TAG({
            id: id
          })
        }
        node.remove()
        this.setCurrentFolder('tag')
        this.$hub.dispatchHub('pushData', this)
      })
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
      this.setCurrentFolder(link)
      // this.SET_VIEW_FILE_TYPE(link)
      // this.$hub.dispatchHub('clickNavMini', this, link)
    },

    navMiniActive (link) {
      if (!this.currentNav) {
        return false
      }
      if (link instanceof Array) {
        return link.indexOf(this.currentNav.type) > -1
      } else {
        return this.currentNav.type === link
      }
    },

    async checkNameConflict (pid, title, oldTitle, type) {
      const taskName = type === 'folder' ? 'getLocalFolderByPid' : 'getLocalNoteByPid'
      let newBrothers = await fetchLocal(taskName, {
        pid: pid
      })
      newBrothers = newBrothers.filter(item => {
        let result = true
        let map = this.$refs.tree.model.store.map
        let p = map[item.pid]
        if (item.trash !== 'NORMAL') {
          result = false
        } else {
          if (p && p.hidden) {
            result = false
          }
        }
        return result
      })

      let titleArr = newBrothers.map(item => item.title)

      if (titleArr.indexOf(title) > -1) {
        this.newTitle = handleNameConflict(
          title,
          oldTitle,
          titleArr
        )
        this.isRenameConfirmShowed = true
        return true
      }

      return false
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

.unexpanded
  transform: scaleY(0)
  overflow hidden

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
.del-button
  width 70px
  height 28px
  line-height 28px
  font-size 13px
  text-align center
  display inline-block
  color #666666
  border 1px solid #E9E9E9
  border-radius 4px

.nav-mini
  position absolute
  top 0
  .icon
    width 70px
    height 70px
    background-repeat  no-repeat
    background-size 50%
    background-position center
  .icon-latest
    background-image url(../../../assets/images/lanhu/nav/documents.png)
    &.active
      background-image url(../../../assets/images/lanhu/nav/documents_highlight.png)
  .icon-share
    background-image url(../../../assets/images/lanhu/nav/share.png)
    &.active
      background-image url(../../../assets/images/lanhu/nav/share_highlight.png)
  .icon-folder_open
    background-image url(../../../assets/images/lanhu/nav/folder_open.png)
    &.active
      background-image url(../../../assets/images/lanhu/nav/folder_open_highlight.png)
  .icon-tag
    background-image url(../../../assets/images/lanhu/nav/tag.png)
    &.active
      background-image url(../../../assets/images/lanhu/nav/tag_highlight.png)
  .icon-bin
    background-image url(../../../assets/images/lanhu/nav/bin.png)
    &.active
      background-image url(../../../assets/images/lanhu/nav/bin_highlight.png)
</style>
