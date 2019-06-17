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
          :content="item.summary"
          :isTop="item.top"
          :isShared="item.share"
          :update_at="item.update_at | yyyymmdd"
          :file_size="item.size"
          :parent_folder="folderNameComputed(item)"
          :need_push="item.need_push_remotely"
          :need_push_local="item.need_push_locally"
          :rawData="item"
          :isDraggable="item.isDraggable"
          :isPushing="notesPushing.indexOf(item._id) > -1"
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
        总共 {{ fileList.length }} 项
      </div>
    </div>
    <modal
      :visible.sync="isDelConfirmShowed"
      width="300px"
      height="90px"
      top="30vh"
      style="padding-bottom:20px "
      transition-name="fade-in-down"
      @close="isDelConfirmShowed = false"
      title="删除确认">
        <div slot="header"><span>  </span></div>
        <div style="text-align:center;padding:10px; 0">
          <p>该文件夹下内容不为空，是否继续删除?</p>
        </div>
        <div class="button-group button-container" slot="footer">
          <div class="button primary" @click="delConfirm">确认删除</div>
          <div class="button" @click="isDelConfirmShowed = false">取消</div>
        </div>
    </modal>
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
import { mapGetters, mapActions } from 'vuex'
import fetchLocal from '../../../utils/fetchLocal'
import { transNoteDataFromRemote } from '../../../utils/mixins/transData'
import { getShareWithMe } from '../../../service'
import SearchBar from '@/components/SearchBar'
// import Loading from '@/components/Loading'
import { FileCard, FileCardGroup } from '@/components/FileCard'
import {
  docHandleMenu1,
  docHandleMenu2,
  folderHandleMenu,
  fileCloudMenu,
  fileInfoMenu,
  binMenu
} from '../Menu'
import {
  listtypeMenu1,
  listtypeMenu2
} from './config'
export default {
  name: 'DocumentList',
  mixins: mixins,
  components: {
    SearchBar,
    // Loading,
    FileCard,
    FileCardGroup
  },
  data () {
    return {
      isDelConfirmShowed: false,
      selectedIdCache: null,
      trashFileCache: [],
      navNeedUpdate: false,
      isListLoading: true,
      isFirstSelect: true,
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
      ]
    }
  },
  filters: {
    yyyymmdd (timestamp) {
      return dayjs(Number(timestamp)).format('YYYY-MM-DD')
    }
  },
  computed: {
    ...mapGetters({
      currentNav: 'GET_CURRENT_NAV',
      currentFile: 'GET_CURRENT_FILE',
      notesPushing: 'GET_NOTES_PUSHING',
      viewFileListType: 'GET_VIEW_FILE_LIST_TYPE',
      viewFileSortType: 'GET_VIEW_FILE_SORT_TYPE',
      viewFileSortOrder: 'GET_VIEW_FILE_SORT_ORDER',
      tagsMap: 'GET_TAGS_MAP',
      selectedTags: 'GET_SELECTED_TAGS',
      searchKeyword: 'GET_SEARCH_KEYWORD'
    }),

    menuData () {
      if (this.currentNav) {
        let menu = this.currentNav.type !== 'latest' ? listtypeMenu1 : listtypeMenu2
        menu.forEach(item => {
          if (item.value === this.viewFileListType || item.value === this.viewFileSortType) {
            item.actived = true
          } else {
            item.actived = false
          }
        })
        return menu
      } else {
        return []
      }
    }
  },

  watch: {
    currentNav (val) {
      if (val.type === 'share') {
        this.fetchSharedFile()
      } else {
        this.refreshList()
      }
    },

    notesPushing (val) {
      console.log('watch-notesPushing', val)
    },

    selectedTags (val) {
      if (this.currentNav.type === 'tag' || this.currentNav.type === 'select') {
        fetchLocal('getLocalTagNote', {
          tags: val
        }).then(notes => {
          this.handleDataFetched([[], notes])
        })
      }
    },

    searchKeyword (val) {
      this.updateFileList()
    },

    viewFileSortType (val) {
      this.updateFileList()
    },

    viewFileSortOrder (val) {
      this.updateFileList()
    }
  },

  mounted () {
    this.$root.$documentList = this
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
      'TOGGLE_SHOW_SHARE_PANEL',
      'TOGGLE_SHOW_HISTORY_PANEL'
    ]),

    fetchSharedFile () {
      getShareWithMe().then(res => {
        console.log('getShareWithMe-res', res)
        if (res.data.returnCode === 200) {
          let data = res.data.body.map(item => transNoteDataFromRemote(item))
          fetchLocal('updateSharedNote', data).then(notes => {
            notes.forEach(note => {
              note.isDraggable = false
            })
            this.handleDataFetched([[], notes])
          })
        }
      }).catch(err => {
        console.log(err)
        fetchLocal('getSharedNote').then(notes => {
          notes.forEach(note => {
            note.isDraggable = false
          })
          this.handleDataFetched([[], notes])
        })
      })
    },

    refreshList () {
      let nav = this.currentNav
      this.isListLoading = true
      this.selectFile(-1)
      if (nav.type === 'latest') {
        fetchLocal('getLatestLocalNote').then(notes => {
          this.handleDataFetched([[], notes])
        })
      } else if (nav.type === 'folder') {
        let params = {
          pid: nav._id || nav.id || '0'
        }
        if (nav.remote_id !== undefined) {
          params.remote_pid = nav.remote_id
        }
        fetchLocal('getLocalFolderByPid', params).then(folders => {
          fetchLocal('getLocalNoteByPid', params, {
            with_parent_folder: true,
            with_summary: true
          }).then(notes => {
            this.handleDataFetched([folders, notes])
          })
        })
      } else if (nav.type === 'tag' || nav.type === 'select') {
        fetchLocal('getLocalTagNote', {
          tags: this.selectedTags
        }).then(notes => {
          this.handleDataFetched([[], notes])
        })
      } else if (nav.type === 'bin') {
        fetchLocal('getLocalTrashFolder').then(folders => {
          fetchLocal('getLocalTrashNote', {
            with_parent_folder: true,
            with_summary: true
          }).then(notes => {
            this.handleDataFetched([folders, notes])
          })
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
      this.stickTopFiles = []
      this.updateFileList()
    },

    updateFileList () {
      let re = new RegExp(this.searchKeyword, 'g')
      let notes = this.fileListSortFunc(this.noteList.filter(file => file.title.search(re) > -1), 'note')
      let folders = this.fileListSortFunc(this.folderList.filter(file => file.title.search(re) > -1), 'folder')
      this.fileList = _.flatten([folders, notes])
      let idx = _.findIndex(this.fileList, { _id: this.selectedIdCache })
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
      let sortOrder = !item.actived ? 'up' : 'down'
      if (value === 'summary' || value === 'list') {
        this.SET_VIEW_FILE_LIST_TYPE(value)
      } else {
        this.SET_VIEW_FILE_SORT_TYPE(value)
        this.SET_VIEW_FILE_SORT_ORDER(sortOrder)
      }
    },

    fileListSortFunc (list, type) {
      let order
      let sortKey
      if (type === 'folder') {
        return list.sort((a, b) => {
          return a.seq - b.seq
        })
      }
      if (this.currentNav.type === 'latest') {
        order = -1
        sortKey = 'update_at'
      } else {
        order = this.viewFileSortOrder === 'down' ? -1 : 1
        sortKey = this.viewFileSortType
      }
      let listTemp = []
      if (sortKey === 'title') {
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
          return (Number(a[sortKey]) -
            Number(b[sortKey])) * order
        })
      }
      let topList = listTemp.filter(item => item.top)
      let downList = listTemp.filter(item => !item.top)
      if (type === 'note') {
        this.stickTopFiles = topList
      }
      return [...topList, ...downList]
    },

    newNote () {
      this.$hub.dispatchHub('newNote', this)
    },

    handleContextmenu (props) {
      if (this.currentNav.type === 'share') {
        return
      }
      this.popupedFile = props
      if (this.currentNav.type === 'bin') {
        this.popupNativeMenu(this.nativeMenus[5])
        return
      }
      if (props.type === 'note') {
        let idx = _.findIndex(this.stickTopFiles, { _id: props.file_id })
        idx = idx === -1 ? 0 : 1
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
      this.selectedIdCache = this.popupedFile.rawData._id
      fetchLocal('updateLocalNote', {
        id: this.popupedFile.file_id,
        top: true
      }).then(res => {
        this.refreshList()
        this.$hub.dispatchHub('pushData', this)
      })
    },

    handleCancelStickTop () {
      this.selectedIdCache = this.popupedFile.rawData._id
      fetchLocal('updateLocalNote', {
        id: this.popupedFile.file_id,
        top: false
      }).then(res => {
        this.refreshList()
        this.$hub.dispatchHub('pushData', this)
      })
    },

    handleExportPDF () { // 导出pdf功能
      // return
      let data = this.popupedFile.rawData
      ipcRenderer.send('print-to-pdf', {
        noteId: data._id,
        title: data.title,
        isPdf: 1
      })
    },

    handleNewFolder () {
      let pid = this.popupedFile.file_id
      this.$hub.dispatchHub('newFolder', this, pid)
    },

    handleNewNote (isTemp) {
      let pid = this.popupedFile.file_id
      fetchLocal('addLocalNote', {
        title: '无标题笔记',
        pid: pid,
        isTemp: isTemp
      }).then(res => {
        this.selectedIdCache = res._id
        this.$root.$navTree.select(pid)
        this.$hub.dispatchHub('pushData', this)
      })
    },

    handleNewTemplateNote () {
      this.handleNewNote(true)
    },

    handleRename () {
      let idx = _.findIndex(this.fileList, { _id: this.popupedFile.file_id })
      this.selectFile(idx)
      this.$hub.dispatchHub('renameFileCard', this, this.popupedFile.file_id)
    },

    handleMove () {
      this.$hub.dispatchHub('showMovePanel', this, {
        file: {
          type: this.popupedFile.type,
          id: this.popupedFile.file_id,
          title: this.popupedFile.title
        },
        tree: this.$root.$navTree.model.children[2]
      })
    },

    handleDuplicate () {
      this.SET_DUPLICATE_FILE(this.copyFile(this.popupedFile.rawData))
    },

    handleRemove () {
      if (this.popupedFile.type === 'folder') {
        let params = {
          pid: this.popupedFile.rawData._id
        }
        fetchLocal('getLocalFolderByPid', params).then(folders => {
          fetchLocal('getLocalNoteByPid', params).then(notes => {
            if (folders.length + notes.length > 0) {
              this.isDelConfirmShowed = true
            } else {
              this.removeFile(this.popupedFile.rawData)
            }
          })
        })
      } else {
        this.removeFile(this.popupedFile.rawData)
      }
    },

    removeFile (file) {
      let taskName = this.popupedFile.type === 'folder'
        ? 'updateLocalFolder'
        : 'updateLocalNote'

      fetchLocal(taskName, {
        id: file._id,
        trash: 'TRASH'
      }).then(res => {
        if (taskName === 'updateLocalFolder') {
          this.$hub.dispatchHub('deleteNavNode', this, file._id)
        }
        this.refreshList()
        this.$hub.dispatchHub('pushData', this)
      })
    },

    delConfirm () {
      this.removeFile(this.popupedFile.rawData)
      this.isDelConfirmShowed = false
    },

    handleNewWindow () {
      ipcRenderer.send('create-preview-window', {
        noteId: this.popupedFile.file_id,
        title: this.popupedFile.title
      })
    },

    handleShare () {
      let idx = _.findIndex(this.fileList, { _id: this.popupedFile.file_id })
      this.selectFile(idx)
      this.TOGGLE_SHOW_SHARE_PANEL(true)
    },

    handleHistory () {
      this.$hub.dispatchHub('diffHtml', this, this.popupedFile)
    },

    handleResume () {
      this.trashFileCache = this.fileList.map(file => file._id)
      this.navNeedUpdate = true
      let fileId = this.popupedFile.file_id
      let taskName = this.popupedFile.type === 'folder'
        ? 'updateLocalFolder'
        : 'updateLocalNote'
      fetchLocal(taskName, {
        id: fileId,
        trash: 'NORMAL'
      }).then(res => {
        this.refreshList()
        const _self = this
        function resumeNode (node) {
          _self.$set(node, 'hidden', false)
          let pNode = folderMap[node.pid]
          if (pNode && pNode.id !== '0' && pNode.hidden) {
            resumeNode(pNode)
          }
        }
        let folderMap = this.$root.$navTree.model.store.map
        let node = folderMap[res._id]
        resumeNode(node)
        this.$hub.dispatchHub('pushData', this)
      })
    },

    handleDelete () {
      let fileId = this.popupedFile.file_id
      let taskName = this.popupedFile.type === 'folder'
        ? 'updateLocalFolder'
        : 'updateLocalNote'
      fetchLocal(taskName, {
        id: fileId,
        trash: 'DELETED'
      }).then(res => {
        this.refreshList()
        this.$hub.dispatchHub('pushData', this)
      })
    },

    copyFile (file) {
      let result = {
        type: file.type,
        title: file.title,
        create_at: file.create_at,
        folder_title: file.folder_title,
        need_push: file.need_push,
        pid: file.pid,
        remote_id: file.remote_id,
        remote_pid: file.remote_pid,
        tags: file.tags,
        seq: file.seq,
        trash: file.trash,
        update_at: file.update_at,
        _id: file._id
      }
      if (file.hasOwnProperty('content') && file.hasOwnProperty('share')) {
        result.content = file.content
        result.share = file.share
      }
      return result
    },

    handleHeaderDbClick () {
      let curWin = this.$remote.getCurrentWindow()
      let isMaximized = curWin.isMaximized()
      if (!isMaximized) {
        curWin.maximize()
      } else {
        curWin.unmaximize()
      }
    },

    folderNameComputed (file) {
      if (this.currentNav.type === 'share') {
        return '与我分享'
      } else {
        return file.parent_folder ? file.parent_folder.title : '我的文件夹'
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

.header
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
