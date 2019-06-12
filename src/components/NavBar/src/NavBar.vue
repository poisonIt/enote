<template>
  <div id="navbar" ref="navbar">
    <Tree
      :style="{ opacity: viewType === 'unexpanded' ? 0 : 1 }"
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
    <modal
      :visible.sync="isDelShowed"
      width="300px"
      top="30vh"
      style="padding-bottom:20px "
      transition-name="fade-in-down"
      @close="close"
      title="删除确认"
    >
        <div slot="header"><span>  </span></div>
        <div style="text-align:center;padding:10px; 0">
            <p>该文件夹下内容不为空，是否继续删除?</p>
        </div>
        <div slot="footer" style="text-align:center; padding-bottom: 10px;">
            <span class="del-button" @click="delConfirm">确认删除</span>
        </div>
    </modal>
  </div>
</template>

<script>
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
      isDelShowed: false,
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
      duplicateFile: 'GET_DUPLICATE_FILE',
      selectedTags: 'GET_SELECTED_TAGS',
      isTagShowed: 'GET_SHOW_TAG_HANDLER'
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
          _self.folderTree = new TreeStore([latestNav, newRootFolder, newTagNav, binNav])
          _self.$nextTick(() => {
            _self.$refs.tree.$children[0].click()
            _self.SET_IS_HOME_READY(true)
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

      fetchLocal('addLocalFolder', {
        pid: nodeData.id || nodeData._id || '0',
        seq: node.model.children.length,
        depth: node.model.getDepth()
      }).then(res => {
        node.addChild({
          id: res._id,
          type: 'folder',
          name: res.title
        })
        this.$hub.dispatchHub('pushData', this)
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
      console.log(node)
      if (node.type === 'select') {
        fetchLocal('updateLocalTag', {
          id: node.data._id || node.data.id || node.id,
          name: node.name
        }).then(res => {
          if (!res) {
            node.name = node.data.name
          } else {
            if (res.name !== node.name) {
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
          this.$hub.dispatchHub('pushData', this)
        })
      }
    },

    handleFolderUpdate (params) {
      this.$refs.tree.updateNodeModel(params)
    },

    handleNodeDrop ({ node, oldParent }) {
      if (node.pid !== oldParent.id) {
        fetchLocal('updateLocalFolder', {
          id: node.data._id || node.data.id || node.id,
          pid: node.pid,
          seq: node.getIndex()
        }).then(() => {
          this.$hub.dispatchHub('pushData', this)
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
      let node = this.popupedNode.model
      let data = node.data
      let pid = data.id || data._id
      let shouldUpdateList = (this.popupedNode.model === this.$refs.tree.model.store.currentNode)

      if (this.duplicateFile.type === 'note') {
        fetchLocal('duplicateLocalNote', {
          id: this.duplicateFile._id,
          pid: pid
        }).then(res => {
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
      if (node.children.length > 0) {
        this.isDelShowed = true
      } else {
        this.del(node)
      }
    },
    delConfirm () {
      let node = this.popupedNode.model
      this.del(node)
      this.isDelShowed = false
    },
    del (node) {
      fetchLocal('updateLocalFolder', {
        id: node.data._id || node.data.id || node.id,
        trash: 'TRASH'
      }).then(res => {
        node.hidden = true
        this.setCurrentFolder('bin')
        this.$hub.dispatchHub('pushData', this)
      })
    },
    close () {
      this.isDelShowed = false
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
      fetchLocal('resumeAllTrash').then(res => {
        this.$hub.dispatchHub('refreshList', this)
        let nodes = res.filter(item => item.type === 'folder')
        let map = this.$refs.tree.model.store.map
        nodes.forEach(node => {
          this.$set(map[node._id], 'hidden', false)
        })
        this.$hub.dispatchHub('pushData', this)
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

</style>
