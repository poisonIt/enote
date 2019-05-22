<template>
  <div class="document-list">
    <div class="header" @dblclick.self="handleHeaderDbClick">
      <div class="button button-back"
        :class="{ disable : !currentNav || !currentNav._id || currentNav.type !== 'folder' }"
        @click="handleBack">
      </div>
      <SearchBar></SearchBar>
      <!-- <span class="title ellipsis">{{ viewName }}</span> -->
      <div class="button button-listtype expand"
        :class="{ summary : viewFileListType === 'summary' }"
        @click="handleList">
        <Menu
          :data="menuData"
          :visible="isMenuVisible"
          :width="140"
          :top="40"
          :fontSize="13"
          :transition="'fade-in-down'"
          @itemClick="handleMenuClick">
        </Menu>
      </div>
    </div>
    <div class="body" ref="body">
      <FileCardGroup
        ref="fileCardGroup"
        @handleSelect="selectFile"
        @titleClick="handleFileTitleClick">
        <FileCard
          v-for="(item, index) in fileList"
          :key="index"
          :pid="item.pid"
          :mini="viewFileListType === 'list'"
          :file_id="item._id"
          :type="item.type"
          :title="item.title"
          :content="item.brief"
          :isTop="item.top"
          :isShared="item.share"
          :update_at="item.update_at | yyyymmdd"
          :file_size="item.size"
          :parent_folder="item.parent_folder ? item.parent_folder.title : '我的文件夹'"
          :need_push="item.need_push_remotely"
          :need_push_local="item.need_push_locally"
          :rawData="item"
          @contextmenu="handleContextmenu"
          @dblclick="handleDbClick(item)">
        </FileCard>
      </FileCardGroup>
      <div class="no-file" v-if="fileList.length === 0">
        <span v-if="currentNav && currentNav.type === 'bin'">回收站为空</span>
        <span v-if="currentNav && currentNav.type !== 'bin'">没有找到文件</span>
        <div v-if="currentNav && currentNav.type !== 'bin'"
          class="new-doc_button"
          @click="newNote">新建笔记
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="num">
        总共 {{ list.length }} 项
      </div>
    </div>
    <!-- <div class="list-loading" v-if="isListLoading">
      <Loading :type="1" fill="#DDAF59" style="transform: scale(1.2) translateY(-60px)"></Loading>
    </div> -->
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import * as _ from 'lodash'
import dayjs from 'dayjs'
import mixins from '../mixins'
import { mapGetters, mapState, mapActions } from 'vuex'

import SearchBar from '@/components/SearchBar'
import Loading from '@/components/Loading'
import { FileCard, FileCardGroup } from '@/components/FileCard'
import {
  docHandleMenu1,
  docHandleMenu2,
  folderHandleMenu,
  fileCloudMenu,
  fileInfoMenu,
  binMenu
} from '../Menu'

export default {
  name: 'DocumentList',

  mixins: mixins,

  components: {
    SearchBar,
    Loading,
    FileCard,
    FileCardGroup
  },

  data () {
    return {
      selectedIdCache: null,
      trashFileCache: [],
      navNeedUpdate: false,
      isListLoading: true,
      isFirstSelect: true,
      list: [],
      fileList: [],
      isMenuVisible: false,
      isFileMenuVisible: false,
      nativeMenuData: [
        docHandleMenu1,
        docHandleMenu2,
        folderHandleMenu,
        fileCloudMenu,
        fileInfoMenu,
        binMenu
      ],
      menuData: [
        {
          label: '摘要',
          value: 'summary',
          type: 'select'
        },
        {
          label: '列表',
          value: 'list',
          type: 'select'
        },
        {
          type: 'separator'
        },
        {
          label: '创建时间',
          value: 'create_at',
          type: 'sort'
        },
        {
          label: '修改时间',
          value: 'update_at',
          type: 'sort'
        },
        {
          label: '文件名称',
          value: 'title',
          type: 'sort'
        },
        {
          label: '文件大小',
          value: 'size',
          type: 'sort'
        }
      ]
    }
  },

  filters: {
    yyyymmdd (timestamp) {
      return dayjs(Number(timestamp)).format('YYYY-MM-DD')
    }
  },

  computed: {
    ...mapState({
      views: state => state.views
    }),
    ...mapGetters({
      currentNav: 'GET_CURRENT_NAV',
      currentFile: 'GET_CURRENT_FILE',
      viewFileListType: 'GET_VIEW_FILE_LIST_TYPE',
      viewFileSortType: 'GET_VIEW_FILE_SORT_TYPE',
      viewFileSortOrder: 'GET_VIEW_FILE_SORT_ORDER',
      tagsMap: 'GET_TAGS_MAP',
      selectedTags: 'GET_SELECTED_TAGS',
      searchKeyword: 'GET_SEARCH_KEYWORD'
    })
  },

  watch: {
    async currentNav (val) {
      console.log('currentNav', val)
      this.refreshList()
    },

    selectedTags (val) {
      console.log('watch-selectedTags', val)
      if (this.currentNav.type === 'tag' || this.currentNav.type === 'select') {
        console.log('watch-selectedTags-1111', val)
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalTagNote'],
          params: [{ tags: val }],
          from: 'DocumentList',
        })
        return
      }
      return
      this.list = this.allFileArr.filter(item => item.trash === 'NORMAL')
      if (val.length > 0) {
        let arr = []
        this.list
          .filter(item => item.type === 'doc')
          .forEach(file => {
            if ([...val].sort().toString() == [...intersection(file.tags, val)].sort().toString()) {
              arr.push(file)
            }
          })
        this.list = this.fileListSortFunc(arr)
      } else {
        return this.fileListSortFunc(this.list)
      }
    },

    searchKeyword (val) {
      this.updateFileList()
    },

    viewFileSortType (val) {
      console.log('viewFileSortType', val)
      // return
      this.updateFileList()
      // this.$set(this.fileList, this.fileListSortFunc(this.fileList))
      // this.fileList = this.fileListSortFunc(this.fileList)
    },

    viewFileSortOrder (val) {
      console.log('viewFileSortOrder', val)
      this.updateFileList()
      // this.list = this.fileListSortFunc(this.list)
    },

    stickTopFiles (val) {
      this.list = this.fileListSortFunc(this.list)
    }
  },

  created () {
    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from === 'DocumentList') {
        console.log('fetch-local-data-response', event, arg)
        if (arg.tasks.indexOf('addLocalNote') > -1) {
          this.$root.$navTree.select(this.popupedFile.file_id)
          return
        } else {
          let localFiles = []
          if (arg.tasks[0] === 'getLocalTagNote') {
            localFiles = [[], arg.res[0]]
          } else {
            localFiles = arg.res
          }
          console.log('localFiles', localFiles)
          this.handleDataFetched(localFiles)
        }
      }
      if (arg.from[0] === 'DocumentList') {
        console.log('fetch-local-data-response', event, arg)
        if (!this.popupedFile) {
          if (['updateLocalFolder', 'updateLocalNote'].indexOf(arg.tasks[0]) > -1) {
            // this.refreshList()
          }
        } else {
          console.log('2222222', this.popupedFile)
          if (arg.from[2] === this.popupedFile.rawData._id) {
            if (['updateLocalFolder', 'updateLocalNote'].indexOf(arg.tasks[0]) > -1) {
              if (arg.from[1] === 'stickTop') {
                this.selectedIdCache = this.popupedFile.rawData._id
              }
              if (arg.from[1] === 'cancelStickTop') {
                this.selectedIdCache = this.popupedFile.rawData._id
              }
              if (arg.from[1] === 'remove') {
                if (this.popupedFile.type === 'folder') {
                  this.$hub.dispatchHub('deleteNavNode', this, this.popupedFile.rawData._id)
                }
              }
              if (arg.from[1] === 'resume') {
              }
              if (arg.from[1] === 'delete') {
              }
              this.refreshList()
            }
            if (arg.from[1] === 'duplicate') {
              this.refreshList()
            }
          }
          if (arg.from[1] === 'remove-1') {
            this.refreshList()
          }
        }
        this.$hub.dispatchHub('pushData', this)
      }
    })
  },

  methods: {
    ...mapActions([
      'SET_CURRENT_FILE',
      'SET_DUPLICATE_FILE',
      'UPDATE_CURRENT_FILE',
      'SET_VIEW_FILE_LIST_TYPE',
      'SET_VIEW_FILE_SORT_TYPE',
      'SET_VIEW_FILE_SORT_ORDER',
      'TOGGLE_SHOW_MOVE_PANEL',
      'TOGGLE_SHOW_SHARE_PANEL'
    ]),

    refreshList () {
      let nav = this.currentNav
      this.isListLoading = true
      this.selectFile(-1)
      let localFiles = [[], []]
      if (nav.type === 'latest') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getAllLocalFolder', 'getAllLocalNote'],
          from: 'DocumentList'
        })
      } else if (nav.type === 'folder') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalFolderByPid', 'getLocalNoteByPid'],
          params: [{
            pid: nav._id || nav.id || '0',
            remote_pid: nav.remote_id
          },
          {
            pid: nav._id || nav.id || '0',
            remote_pid: nav.remote_id
          }],
          from: 'DocumentList',
        })
      } else if (nav.type === 'tag') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalTagNote'],
          params: [
            { tags: this.selectedTags}
          ],
          from: 'DocumentList',
        })
      } else if (nav.type === 'bin') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalTrashFolder', 'getLocalTrashNote'],
          from: 'DocumentList',
        })
      }
    },

    handleDataFetched (localFiles) {
      if (this.currentNav.type !== 'bin') {
        this.folderList = localFiles[0].filter(file => file.trash === 'NORMAL')
        this.noteList = localFiles[1].filter(file => file.trash === 'NORMAL')
      } else {
        this.folderList = localFiles[0]
        this.noteList = localFiles[1]
      }
      this.list = _.flatten(localFiles)
      this.stickTopFiles = []
      this.updateFileList()
    },

    updateFileList () {
      let notes = this.fileListSortFunc(this.noteList.filter(file => file.title.indexOf(this.searchKeyword) > -1))
      let folders = this.folderList.filter(file => file.title.indexOf(this.searchKeyword) > -1)

      this.fileList = _.flatten([folders, notes])
      let idx = _.findIndex(this.fileList, { _id: this.selectedIdCache })
      console.log('idx', idx)
      idx = (idx === -1 ? 0 : idx)
      this.selectFile(this.fileList.length > 0 ? idx : -1)
      this.isListLoading = false
      
      if (this.navNeedUpdate) {
        let fileListIds = this.fileList.map(file => file._id)
        let resumedFileIds = _.difference(this.trashFileCache, fileListIds)
        let folderMap = this.$root.$navTree.model.store.map
        resumedFileIds.forEach(id => {
          let node = folderMap[id]
          if (node) {
            node.hidden = false
          }
        })
        this.navNeedUpdate = false
      }
    },

    selectFile (index) {
      const file = this.fileList[index]
      console.log('selectFile', index, file)
      if (file) {
        if (this.currentFile && file._id === this.currentFile._id) return
        this.SET_CURRENT_FILE(this.copyFile(file))
        this.$refs.fileCardGroup.select(index) // visually select file
      } else {
        this.SET_CURRENT_FILE(null)
      }
    },

    handleFileTitleClick (index) {
      let file = this.fileList[index]
      this.handleDbClick(file)
    },

    handleBack () {
      this.navUpHub()
    },

    handleList () {
      this.isMenuVisible = !this.isMenuVisible
    },

    handleMenuClick (value, item) {
      if (value === 'summary' || value === 'list') {
        this.SET_VIEW_FILE_LIST_TYPE(value)
      } else {
        this.SET_VIEW_FILE_SORT_TYPE(value)
        this.SET_VIEW_FILE_SORT_ORDER(item.actived ? 'up' : 'down')
      }
    },

    handleFileMenuClick (value, item) {
      console.log('handleFileMenuClick', value, item)
    },

    fileListSortFunc (list) {
      let order = this.viewFileSortOrder === 'down' ? -1 : 1
      let listTemp = []
      if (this.viewFileSortType === 'title') {
        let en = list.filter(item => item.title[0].charCodeAt() <= 122 || !item.title[0])
        let zh = list.filter(item => item.title[0].charCodeAt() > 122)

        en = en.sort((a, b) => {
          let aCode = a.title[0] ? a.title[0].charCodeAt() : 32
          let bCode = b.title[0] ? b.title[0].charCodeAt() : 32
          return (aCode - bCode) * order
        })

        zh = zh.sort((a, b) => {
          return (a.title[0].localeCompare(b.title[0], 'zh')) * order
        })
        listTemp = order === 1 ? [...en, ...zh] : [...zh, ...en]
      } else {
        listTemp = list.sort((a, b) => {
          return (Number(a[this.viewFileSortType]) - Number(b[this.viewFileSortType])) * order
        })
      }
      let topList = listTemp.filter(item => item.top)
      let downList = listTemp.filter(item => !item.top)
      this.stickTopFiles = topList

      return [...topList, ...downList]
    },

    newNote () {
      this.$hub.dispatchHub('newNote', this)
    },

    handleContextmenu (props) {
      console.log('handleContextmenu-11', props)
      this.popupedFile = props
      if (this.currentNav.type === 'bin') {
        this.popupNativeMenu(this.nativeMenus[5])
        return
      }
      if (props.type === 'note') {
        let idx = _.findIndex(this.stickTopFiles, {_id: props.file_id})
        idx = idx === -1 ? 0 : 1
        // let idx = this.stickTopFiles.indexOf(props.file_id) === -1 ? 0 : 1
        this.popupNativeMenu(this.nativeMenus[idx])
      } else if (props.type === 'folder') {
        this.popupNativeMenu(this.nativeMenus[2])
      }
    },

    handleDbClick (file) {
      if (file.type === 'folder') {
        this.$root.$navTree.select(file._id)
      }
    },

    handleStickTop () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalNote'],
        params: [{
          id: this.popupedFile.file_id,
          top: true
        }],
        from: ['DocumentList', 'stickTop', this.popupedFile.file_id]
      })
    },

    handleCancelStickTop () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalNote'],
        params: [{
          id: this.popupedFile.file_id,
          top: false
        }],
        from: ['DocumentList', 'cancelStickTop', this.popupedFile.file_id]
      })
    },

    handleNewNote (isTemp) {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalNote'],
        params: [{
          title: '无标题笔记',
          pid: this.popupedFile.file_id
        }],
        from: 'DocumentList'
      })
    },

    handleNewTemplateNote () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalNote'],
        params: [{
          title: '无标题笔记',
          pid: this.popupedFile.file_id,
          isTemp: true
        }],
        from: 'DocumentList'
      })
    },

    handleRename () {
      this.$hub.dispatchHub('renameFileCard', this, this.popupedFile.file_id)
    },

    handleMove () {
      this.$hub.dispatchHub('showMovePanel', this, {
        file: {
          type: this.popupedFile.type,
          id: this.popupedFile.file_id,
          title: this.popupedFile.title
        },
        tree: this.$root.$navTree.model.children[1]
      })
    },

    handleDuplicate () {
      console.log('handleDuplicate', this.popupedFile)
      this.SET_DUPLICATE_FILE(this.copyFile(this.popupedFile.rawData))
    },

    handleRemove () {
      console.log('handleRemove', this.popupedFile)
      let taskName = this.popupedFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
      ipcRenderer.send('fetch-local-data', {
        tasks: [taskName],
        params: [{
          id: this.popupedFile.file_id,
          trash: 'TRASH'
        }],
        from: ['DocumentList', 'remove', this.popupedFile.file_id]
      })
    },
    
    handleNewWindow () {
      ipcRenderer.send('create-preview-window', {
        noteId: this.popupedFile.file_id,
        title: this.popupedFile.title
      })
    },

    handleShare () {
      let idx = _.findIndex(this.fileList, { _id: this.popupedFile.file_id} )
      console.log('handleShare', this.popupedFile, idx)
      this.selectFile(idx)
      this.TOGGLE_SHOW_SHARE_PANEL(true)
      // this.$hub.dispatchHub('shareFile', this, this.popupedFile.file_id)
    },

    handleResume () {
      console.log('handleResume', this.popupedFile)
      this.trashFileCache = this.fileList.map(file => file._id)
      this.navNeedUpdate = true
      let taskName = this.popupedFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
      ipcRenderer.send('fetch-local-data', {
        tasks: [taskName],
        params: [{
          id: this.popupedFile.file_id,
          trash: 'NORMAL'
        }],
        from: ['DocumentList', 'resume', this.popupedFile.file_id]
      })
    },

    handleDelete () {
      console.log('handleDelete', this.popupedFile)
      let taskName = this.popupedFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
      ipcRenderer.send('fetch-local-data', {
        tasks: [taskName],
        params: [{
          id: this.popupedFile.file_id,
          trash: 'DELETED'
        }],
        from: ['DocumentList', 'delete', this.popupedFile.file_id]
      })
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
    },

    handleHeaderDbClick () {
      let curWin = this.$remote.getCurrentWindow()
      let isMaximized = curWin.isMaximized()
      if (!isMaximized) {
        curWin.maximize()
      } else {
        curWin.unmaximize()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.document-list
  width 100%
  height 100%
  position relative
  .header
    width inherit
    height 60px
    padding 14px
    display flex
    flex-direction row
    justify-content space-between
    align-items center
    border-bottom 1px solid #e6e6e6
    -webkit-app-region drag
    .title
      flex .85
      text-align center
      font-size 14px

.body
  position relative
  height 100%
  padding-bottom 90px
  overflow-y scroll
  .no-file
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content center
    font-size 12px
    color #999
  .new-doc_button
    width 110px
    height 36px
    margin-top 10px
    border-radius 3px
    background-color #DDAF59
    color #fff
    font-size 12px
    font-weight 500
    text-align center
    line-height 36px

.footer
  width 100%
  position absolute
  bottom 0
  border-top 1px solid #e6e6e6
  background-color #FCFBF7
  .num
    height 30px
    line-height 30px
    padding-left 20px
    font-size 12px
    letter-spacing 1px

.button
  position relative
  width 40px
  height 24px
  border-radius 0
  background-color inherit
  border none
  &::before
    content ''
    display block
    width 28px
    height 18px
    position absolute
    top 50%
    left 50%
    transform translate(-50%, -50%)
    background-repeat no-repeat
    background-size 100%
    background-position center
  &.button-back
    &::before
      background-image url(../../../assets/images/lanhu/back@2x.png)
    &.disable
      &::before
        background-image url(../../../assets/images/lanhu/back_dis@2x.png)
  &.expand
    &::before
      background-image url(../../../assets/images/lanhu/view@2x.png)
    &.summary
      &::before
        background-image url(../../../assets/images/lanhu/view@2x.png)

.list-loading
  position absolute
  top 0
  width 100%
  height 100%
  margin-top 60px
  display flex
  align-items center
  justify-content center
  background-color #fcfbf7
  z-index 9999
</style>
