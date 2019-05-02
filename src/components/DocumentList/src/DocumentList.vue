<template>
  <div class="document-list">
    <div class="header">
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
          :update_at="item.update_at | yyyymmdd"
          :file_size="Number(item.content ? item.content.length : '')"
          :parent_folder="item.folder_title || ''"
          :need_push="item.need_push_remotely"
          :need_push_local="item.need_push_locally"
          @contextmenu="handleContextmenu">
        </FileCard>
      </FileCardGroup>
      <div class="no-file" v-if="fileList.length === 0">
        <span v-if="viewFileType === 'recycle'">回收站为空</span>
        <span v-if="viewFileType !== 'recycle'">没有找到文件</span>
        <div v-if="viewFileType !== 'recycle'"
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
    <div class="list-loading" v-if="isListLoading">
      <Loading :type="1" fill="#DDAF59" style="transform: scale(1.2) translateY(-60px)"></Loading>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
// import { clone, intersection } from 'lodash'
import * as _ from 'lodash'
import dayjs from 'dayjs'
import mixins from '../mixins'
// import { readFile } from '@/utils/file'
import { mapGetters, mapState, mapActions } from 'vuex'
import SearchBar from '@/components/SearchBar'
import Loading from '@/components/Loading'
import { FileCard, FileCardGroup } from '@/components/FileCard'
import {
  docHandleMenu1,
  docHandleMenu2,
  folderHandleMenu,
  fileCloudMenu,
  fileInfoMenu
} from '../Menu'
import LocalDAO from '@/../db/api'
import {
  getAllLocalFolder,
  getAllLocalNote,
  getLocalFolderByPid,
  getLocalNoteByPid,
  getLocalTrashFolder,
  getLocalTrashNote,
  addLocalNote,
  removeLocalNote,
  updateLocalNote
} from'@/service/local'

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
        fileInfoMenu
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
          value: 'file_name',
          type: 'sort'
        },
        {
          label: '文件大小',
          value: 'file_size',
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
      contentCache: 'GET_EDITOR_CONTENT_CACHE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
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
      this.isListLoading = true
      this.selectFile(-1)
      let localFiles = [[], []]
      if (val.type === 'latest') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getAllLocalFolder', 'getAllLocalNote'],
          from: 'DocumentList'
        })
      } else if (val.type === 'folder') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalFolderByPid', 'getLocalNoteByPid'],
          params: [{
            pid: val._id || val.id || '0',
            remote_pid: val.remote_id
          },
          {
            pid: val._id || val.id || '0',
            remote_pid: val.remote_id
          }],
          from: 'DocumentList',
        })
      } else if (val.type === 'tag') {
      } else if (val.type === 'bin') {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalTrashFolder', 'getLocalTrashNote'],
          from: 'DocumentList',
        })
      }
    },

    selectedTags (val) {
      return
      console.log('watch-selectedTags', val, this.tagsMap)
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
      return
      this.list = this.fileListSortFunc(this.list)
    },

    viewFileSortOrder (val) {
      console.log('viewFileSortOrder', val)
      this.list = this.fileListSortFunc(this.list)
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
          return
        } else {
          let localFiles = arg.res
          this.handleDataFetched(localFiles)
        }
      }
    })
  },

  methods: {
    ...mapActions([
      'SAVE_DOC',
      'SET_EDITOR_CONTENT',
      'SET_EDITOR_CONTENT_CACHE',
      'EDIT_FILE',
      'EDIT_DOC',
      'STICK_TOP_FILE',
      'CANCEL_STICK_TOP_FILE',
      'SET_CURRENT_FILE',
      'UPDATE_CURRENT_FILE',
      'SET_VIEW_FILE_LIST_TYPE',
      'SET_VIEW_FILE_SORT_TYPE',
      'SET_VIEW_FILE_SORT_ORDER',
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    handleDataFetched (localFiles) {
      this.folderList = localFiles[0]
      this.noteList = localFiles[1]
      this.list = _.flatten(localFiles)
      this.stickTopFiles = []
      this.updateFileList()
      this.selectFile(this.list.length > 0 ? 0 : -1)
      this.isListLoading = false
    },

    updateFileList () {
      let notes = this.fileListSortFunc(this.noteList.filter(file => file.title.indexOf(this.searchKeyword) > -1))
      let folders = this.folderList.filter(file => file.title.indexOf(this.searchKeyword) > -1)

      this.fileList = _.flatten([folders, notes])
    },

    selectFile (index) {
      const file = this.fileList[index]
      console.log('selectFile', index, file)
      this.$refs.fileCardGroup.select(index) // visually select file
      this.SET_CURRENT_FILE(file)
    },

    handleFileTitleClick (index) {
      let file = this.fileList[index]
      this.clickFolderHub(file.id)
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
      let listTemp = list.sort((a, b) => {
        return (Number(a[this.viewFileSortType]) - Number(b[this.viewFileSortType])) * order
      })
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
      this.popupedFile = props.file_id
      if (this.currentNav.type === 'bin') return
      if (props.type === 'note') {
        let idx = this.stickTopFiles.indexOf(props.file_id) === -1 ? 0 : 1
        this.popupNativeMenu(this.nativeMenus[idx])
      } else if (props.type === 'folder') {
        this.popupNativeMenu(this.nativeMenus[2])
      }
    },

    handleStickTop () {
      updateLocalNote({
        id: this.popupedFile,
        top: true
      }).then(() => {
        let file = _.find(this.fileList, { _id: this.popupedFile })
        let idx = this.fileList.indexOf(file)
        file.top = true
        this.fileList.splice(idx, 1)
        this.fileList.unshift(file)
        this.selectFile(0)
        this.$refs.body.scrollTop = 0
      })
    },

    handleCancelStickTop () {
      this.CANCEL_STICK_TOP_FILE(this.popupedFile)
    },

    handleNewNote () {
      addLocalNote({
        title: '无标题笔记',
        pid: this.popupedFile,
        isTemp: false
      }).then(res => {
        console.log('add-local-note-res', res)
        this.$hub.dispatchHub('setCurrentFolder', this, this.popupedFile)
      })
    },

    handleRename () {
      this.$hub.dispatchHub('renameFileCard', this, this.popupedFile)
    },

    handleMove () {
      console.log('handleMove')
      this.TOGGLE_SHOW_MOVE_PANEL(this.popupedFile)
    },

    handleDuplicate () {
      console.log('handleDuplicate')
    },

    handleDelete () {
      console.log('handleDelete')
      this.$hub.dispatchHub('deleteFileCard', this, this.currentFile.id)
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
  z-index 9999999
</style>
