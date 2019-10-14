<template>
  <div :class="showHeader?'document-list top' : 'document-list'">
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
      <InfiniteScroll
        @next="next"
        :distance="distance"
        :end="end"
        :text="endText"
        v-if="currentNav.type === 'public'">
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
            :file_size="Number(item.size)"
            :username="item.username"
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
      </InfiniteScroll>
      <FileCardGroup
          v-else
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
            :isTrash="item.trash"
            :update_at="item.update_at | yyyymmdd"
            :file_size="Number(item.size)"
            :username="item.username"
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
        <div v-if="showNewNoteButton"
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
      body-height="100%"
      top="30vh"
      style="padding-bottom:20px"
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
    <div :class="showHeader?'list-loading top_title':'list-loading'" v-if="isListLoading">
      <Loading :type="1" fill="#DDAF59" style="transform: scale(1.2) translateY(-60px)"></Loading>
    </div>
    <div class="absence_toast" v-if="is_absence">{{ absence_info }}</div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import * as _ from 'lodash'
import dayjs from 'dayjs'
import mixins from '../mixins'
import { mapGetters, mapActions } from 'vuex'
import fetchLocal from '../../../utils/fetchLocal'
import { handleNameConflict } from '../../../utils/utils'
import { transNoteDataFromRemote } from '../../../utils/mixins/transData'
import { getShareWithMe, getPublicNote, saveShareWithMe, delPublicNote } from '../../../service'
import SearchBar from '@/components/SearchBar'
import Loading from '@/components/Loading'
import InfiniteScroll from 'vt-infinitescroll'
import { FileCard, FileCardGroup } from '@/components/FileCard'
import {
  docHandleMenu1,
  docHandleMenu2,
  folderHandleMenu,
  fileCloudMenu,
  fileInfoMenu,
  binMenu,
  publicMenu,
  delPublicMenu
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
    Loading,
    FileCard,
    FileCardGroup,
    InfiniteScroll
  },
  data () {
    return {
      is_absence: false,
      absence_info: '',
      showHeader: false,
      distance: 40,
      endText: '没有更多数据了',
      // publicNoteHeight: 0,
      isDelConfirmShowed: false,
      selectedFileIdx: -1,
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
        binMenu,
        publicMenu,
        delPublicMenu
      ],
      page: 0,
      size: 10,
      totalPages: 0,
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
      searchKeyword: 'GET_SEARCH_KEYWORD',
      renameFileId: 'GET_RENAME_FILE_ID',
      network_status: 'GET_NETWORK_STATUS',
      userInfo: 'GET_USER_INFO'
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
    },
    showNewNoteButton () {
      return this.currentNav &&
        this.currentNav.type !== 'tag' &&
        this.currentNav.type !== 'select' &&
        this.currentNav.type !== 'bin' &&
        this.currentNav.type !== 'share' &&
        this.currentNav.type !== 'public'
    },
    end () {
      // console.log(this.totalPages, this.page)
      return this.page === this.totalPages
    }
  },
  watch: {
    currentNav (val) {
      console.log('wacth-currentNav', val)
      if (val.type === 'share') {
        this.fetchSharedFile()
      } else if (val.type === 'public') {
        this.page = this.totalPages = 0
        this.fetchPublicFile({ page: 0, size: 10, sort: this.viewFileSortType })
      } else {
        this.refreshList()
      }
    },
    notesPushing (val) {
      // console.log('watch-notesPushing', val)
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
    },
    fileList (val) {
      // console.log('watch-fileList', val)
    }
  },
  created () {
    ipcRenderer.on('communicate', (event, arg) => {
      if ((arg.from === 'Preview' || arg.from === 'pushData') && arg.tasks.indexOf('refreshDocumentList') > -1) {
        if (this.currentFile) {
          this.selectedIdCache = this.currentFile._id
        }
        this.refreshList()
      }
    })

    if (this.$remote.app.appConf.platform !== 'darwin') {
      this.showHeader = true
    }
  },
  mounted () {
    this.$root.$documentList = this
    // this.publicNoteHeight = this.$refs.body.offsetHeight
    // console.log(this.publicNoteHeight)
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
      if (this.network_status === 'online') {
        this.isListLoading = true
        getShareWithMe().then(resp => {
          // console.log(resp)
          let notes = resp.data.body.map(item => transNoteDataFromRemote(item))
          fetchLocal('updateSharedNote', notes).then(res => {
            this.handleDataFetched([[], res])
            this.isListLoading = false
          })
        })
      } else {
        fetchLocal('getSharedNote').then(notes => {
          notes.forEach(note => {
            note.isDraggable = false
          })
          this.handleDataFetched([[], notes])
        })
      }
    },
    fetchPublicFile (reqList) {
      if (this.network_status === 'online') {
        if (this.page === 0) {
          this.isListLoading = true
        }
        getPublicNote(reqList).then(resp => {
          // console.log('返回数据', resp.data.body.content)
          // console.log(resp.data.body.content)
          this.totalPages = resp.data.body.totalPages - 1
          let publicNotes = []
          publicNotes = resp.data.body.content

          let notes = publicNotes.map(item => transNoteDataFromRemote(item))
          fetchLocal('updatePublicNote', notes).then(res => {
            this.handleDataFetched([[], res], true)
            this.isListLoading = false
          })
        })
      } else {
        fetchLocal('getPublicNote').then(notes => {
          notes.forEach(note => {
            note.isDraggable = false
          })
          this.handleDataFetched([[], notes])
        })
      }
    },
    refreshList (idx) {
      let nav = this.currentNav
      this.isListLoading = false
      this.selectFile(-1)
      if (nav.type === 'latest') {
        fetchLocal('getLatestLocalNote').then(notes => {
          let folderMap = this.$root.$navTree.model.store.map
          let n = notes.filter(note => {
            return folderMap[note.pid] && !folderMap[note.pid].hidden
          })
          this.handleDataFetched([[], n])
        })
      } else if (nav.type === 'folder') {
        const fid = nav.id === null ? '-1' : (nav.id || nav._id || '0')
        console.log(fid)
        let params = {
          pid: fid
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
        if (this.selectedTags.length === 0) {
          this.handleDataFetched([[], []])
        } else {
          fetchLocal('getLocalTagNote', {
            tags: this.selectedTags
          }).then(notes => {
            this.handleDataFetched([[], notes])
          })
        }
      } else if (nav.type === 'bin') {
        fetchLocal('getLocalTrashFolder').then(folders => {
          fetchLocal('getLocalTrashNote', {
            with_parent_folder: true,
            with_summary: true
          }).then(notes => {
            this.handleDataFetched([folders, notes])
          })
        })
      } else if (nav.type === 'public') {
        console.log('nav-public', nav)

      }
    },

    handleDataFetched (localFiles, isAppend) {
      // console.log(localFiles[1])
      if (this.currentNav.type !== 'bin') {
        this.folderList = localFiles[0].filter(file => file.trash === 'NORMAL')
        if (this.currentNav.type === 'public') {
          if (isAppend) {
            this.noteList = this.page === 0 ? localFiles[1] : this.noteList.concat(localFiles[1])
          } else {
            this.noteList = localFiles[1]
          }
        } else if (this.currentNav.type === 'share') {
          if (isAppend) {
            this.noteList = this.noteList.concat(localFiles[1])
          } else {
            this.noteList = localFiles[1]
          }
        } else {
          if (isAppend) {
            this.noteList = this.noteList.concat(localFiles[1].filter(file => file.trash === 'NORMAL'))
          } else {
            this.noteList = localFiles[1].filter(file => file.trash === 'NORMAL')
          }
        }
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
      // console.log(this.fileList)
      let idx = _.findIndex(this.fileList, { _id: this.selectedIdCache })
      idx = (idx === -1 ? 0 : idx)
      this.selectFile(this.fileList.length > 0 ? idx : -1)
      if (this.currentNav.type !== 'public') {
        this.scrollToSelected()
      }
      // this.scrollToSelected()
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
      if (this.renameFileId !== '') {
        this.$nextTick(() => {
          let idx = _.findIndex(this.fileList, { _id: this.renameFileId })
          this.selectFile(idx)
          this.$hub.dispatchHub('renameFileCard', this, this.renameFileId)
        })
      }
    },
    selectFile (index) {
      this.selectedFileIdx = index
      const file = this.fileList[index]
      this.is_absence = false
      if (file) {
        if (this.currentNav.type === 'share') {
          if (!file.share || file.trash !== 'NORMAL') {
            if (!file.share) {
              this.absence_info = '该笔记已被分享者取消分享'
              this.is_absence = true
              setTimeout(() => {
                this.is_absence = false
              }, 3000)
            } else {
              this.absence_info = '该笔记已被分享者删除'
              this.is_absence = true
              setTimeout(() => {
                this.is_absence = false
              }, 3000)
            }
            return
          }
        }

        if (this.currentFile && file._id === this.currentFile._id) return
        this.SET_CURRENT_FILE(this.copyFile(file))
        this.$refs.fileCardGroup.select(index) // visually select file
      } else {
        this.SET_CURRENT_FILE(null)
      }
    },
    scrollToSelected () {
      this.$nextTick(() => {
        let bodyEl = this.$refs.body
        let selectedEl = Array.prototype.slice.call(this.$refs.fileCardGroup.$el.childNodes)[this.selectedFileIdx]
        if (selectedEl) {
          let sT = this.$refs.body.scrollTop
          let oT = selectedEl.offsetTop
          let h = Number(getComputedStyle(bodyEl, null).height.replace('px', ''))
          // console.log(sT, oT, oT + h)
          if (sT < oT - h + 100 || sT > oT) {
            this.$refs.body.scrollTop = oT
          }
        }
      })
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
      console.log(props)
      this.popupedFile = props
      if (this.currentNav.type === 'share' && props.type === 'note') {
        // console.log(this.nativeMenus)
        if (props.isShared && props.isTrash === "NORMAL") {
          this.popupNativeMenu(this.nativeMenus[3])
          return
        } else {
          return
        }

      }
      if (this.currentNav.type === 'bin') {
        this.popupNativeMenu(this.nativeMenus[5])
        return
      }
      if (this.currentNav.type === 'public' && props.type === 'note') {
        // let username = "张莉莎"
        // console.log(this.userInfo.username)
        if (props.username === this.userInfo.username) {
          this.popupNativeMenu(this.nativeMenus[7])
        } else {
          this.popupNativeMenu(this.nativeMenus[6])
        }
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
    handleSaveNote () {
      // console.log(this.popupedFile)
      saveShareWithMe(this.popupedFile.rawData.publicNoteId).then(resp => {
        console.log(resp)
        if (resp.data.returnCode === 200) {
          this.$Message.success('保存成功')
        }
      })
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
            let files = [...folders, ...notes].filter(file => file.trash === 'NORMAL')
            if (files.length > 0) {
              this.isDelConfirmShowed = true
            } else {
              this.removeFile(this.popupedFile.rawData)
            }
          })
        })
      } else if (this.currentNav.type === 'public' && this.popupedFile.type === 'note') {
        //删除笔记
        console.log(this.popupedFile)
        delPublicNote({ publicId: this.popupedFile.rawData.publicNoteId }).then(resp => {
          console.log(resp)
          if (resp.data.returnCode === 200) {
            this.$Message.success('删除成功')
            this.fetchPublicFile({ page: this.page, size: this.size })
          }
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
      // console.log(this.popupedFile)
      ipcRenderer.send('create-preview-window', {
        noteId: this.popupedFile.file_id,
        title: this.popupedFile.title,
        isReadOnly: this.currentNav.type === 'public' ? true : false
      })
    },
    handleShare () {
      // console.log(this.popupedFile)
      let idx = _.findIndex(this.fileList, { _id: this.popupedFile.file_id })
      this.selectFile(idx)
      this.TOGGLE_SHOW_SHARE_PANEL(true)
    },
    handleHistory () {
      this.$hub.dispatchHub('diffHtml', this, this.popupedFile)
    },
    async handleResume () {
      this.trashFileCache = this.fileList.map(file => file._id)
      this.navNeedUpdate = true
      let fileId = this.popupedFile.file_id
      let newTitle = this.popupedFile.title
      let taskName = this.popupedFile.type === 'folder'
        ? 'updateLocalFolder'
        : 'updateLocalNote'
      let pTaskName = this.popupedFile.type === 'folder'
        ? 'getLocalFolderByPid'
        : 'getLocalNoteByPid'
      let newBrothers = await fetchLocal(pTaskName, {
        pid: this.popupedFile.rawData.pid
      })
      newBrothers = newBrothers.filter(item => {
        let result = true
        let map = this.$root.$navTree.model.store.map
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
      if (titleArr.indexOf(newTitle) > -1) {
        newTitle = handleNameConflict(
          newTitle,
          newTitle,
          titleArr
        )
      }
      fetchLocal(taskName, {
        id: fileId,
        title: newTitle,
        trash: 'NORMAL'
      }).then(res => {
        this.refreshList()
        const _self = this
        function resumeNode (node) {
          _self.$set(node, 'hidden', false)
          _self.$set(node, 'name', newTitle)
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
      // console.log(file)
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
        _id: file._id,
        noteFiles: file.noteFiles || [],
        publicNoteId: file.publicNoteId || ''
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
      } else if (this.currentNav.type === 'public') {
        return '研究部晨会'
      } else {
        return file.parent_folder ? file.parent_folder.title : '我的文件夹'
      }
    },
    next () {
      // console.log('1111')
      this.page++

      this.fetchPublicFile({ page: this.page, size: this.size, sort: this.viewFileListType })
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
.top
  padding 30px 0 0 0
.body
  position relative
  height 100%
  padding-bottom 90px
  overflow-y scroll
  &::-webkit-scrollbar
    display none
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
  &.top_title
    top 30px
.absence_toast
  width 175px
  height 36px
  background rgba(0,0,0,1)
  border-radius 4px
  opacity 0.6
  position absolute
  top 0
  // left 0
  bottom 0
  right -80%
  margin auto
  z-index 999
  font-size 12px
  text-align center
  font-family PingFangSC-Regular,PingFangSC
  font-weight 400
  color rgba(255,255,255,1)
  line-height 36px
</style>
<style lang="stylus">
.end
  height 40px !important
  .text
    font-size 12px !important
.more
  height 40px !important
  visibility hidden
</style>
