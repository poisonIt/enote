<template>
  <div class="document-list">
    <div class="header">
      <div class="button button-back"
        :class="{ disable : viewFileType !== 'new folder' }"
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
          v-for="(item, index) in list"
          :key="index"
          :mini="viewFileListType === 'list'"
          :file_id="item.id"
          :type="item.type"
          :title="item.title"
          :content="item.brief"
          :isTop="stickTopFiles.indexOf(item.id) > -1"
          :update_at="item.update_at | yyyymmdd"
          :file_size="Number(item.content.length)"
          :parent_folder="getParentFolderTitle(item)"
          :need_push="item.need_push_remotely"
          :need_push_local="item.need_push_locally"
          @contextmenu="handleContextmenu">
        </FileCard>
      </FileCardGroup>
      <div class="no-file" v-if="list.length === 0">
        <span v-if="viewFileType === 'recycle'">回收站为空</span>
        <span v-if="viewFileType !== 'recycle'">没有找到文件</span>
        <div v-if="viewFileType !== 'recycle'"
          class="new-doc_button"
          @click="newDoc">新建笔记
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="num">
        总共 {{ fileList.length }} 项
      </div>
    </div>
  </div>
</template>

<script>
import { clone, intersection } from 'lodash'
import dayjs from 'dayjs'
import mixins from '../mixins'
// import { readFile } from '@/utils/file'
import { mapGetters, mapState, mapActions } from 'vuex'
import SearchBar from '@/components/SearchBar'
import { FileCard, FileCardGroup } from '@/components/FileCard'
import {
  docHandleMenu1,
  docHandleMenu2,
  folderHandleMenu,
  fileCloudMenu,
  fileInfoMenu
} from '../Menu'
import LocalDAO from '@/../db/api'

export default {
  name: 'DocumentList',

  mixins: mixins,

  components: {
    SearchBar,
    FileCard,
    FileCardGroup
  },

  data () {
    return {
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
      viewName: 'GET_VIEW_NAME',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      allFileMap: 'GET_FILES',
      allFileArr: 'GET_FILES_ARRAY',
      rootFiles: 'GET_ROOT_FILES',
      latestFiles: 'GET_LATEST_FILES',
      folders: 'GET_FOLEDERS',
      recycle: 'GET_RECYCLE_FILES',
      files: 'GET_CURRENT_FILES',
      currentFolder: 'GET_CURRENT_FOLDER',
      currentFile: 'GET_CURRENT_FILE',
      stickTopFiles: 'GET_STICK_TOP_FILES',
      viewFolder: 'GET_VIEW_FOLDER',
      viewFileListType: 'GET_VIEW_FILE_LIST_TYPE',
      viewFileSortType: 'GET_VIEW_FILE_SORT_TYPE',
      viewFileSortOrder: 'GET_VIEW_FILE_SORT_ORDER',
      tagsMap: 'GET_TAGS_MAP',
      selectedTags: 'GET_SELECTED_TAGS',
      currentNav: 'GET_CURRENT_NAV'
    })
  },

  watch: {
    allFileArr (val) {
      this.fileList = val
      console.log('watch-allFileArr', val, this.currentNav)
      if (this.currentNav && this.currentNav.link === 'latest') {
        this.list = val.filter(item => item.trash === 'NORMAL')
        this.selectFile(0)
      }
    },

    currentNav (val) {
      console.log('watch-currentNav', val, this.fileList)
      if (val.link === 'latest') {
        this.list = this.fileList.filter(item => 
          item.trash === 'NORMAL')
          .sort((a, b) => a.update_at - b.update_at)
      }
      if (val.link === 'folders') {
        this.list = this.fileList.filter(item => item.trash === 'NORMAL'
          && item.parent_folder === '/')
      }
      if (val.link === 'new folder') {
        console.log('this.fileList', this.fileList)
        this.list = this.fileList.filter(item => item.trash === 'NORMAL'
          && (item.parent_folder === val.id || item.parent_folder === val.remote_id))
      }
      if (val.link === 'recycle') {
        this.list = this.fileList.filter(item => item.trash === 'TRASH')
      }
      this.selectFile(0)
    },

    viewFileType (val) {
      // let currentFiles = this.getCurrentFiles(this.currentFolder)
      // let list = []
      // console.log('viewFileType', val, this.latestFiles, this.allFileArr, currentFiles)
      // switch (val) {
      //   case 'latest':
      //     list = this.allFileArr
      //     break
      //   case 'folders':
      //     list = currentFiles
      //     break
      //   case 'new folder':
      //     list = currentFiles
      //     break
      //   case 'tags':
      //     if (this.selectedTags.length === 0) {
      //       list = this.latestFiles
      //       break
      //     }
      //     list = this.latestFiles.filter(item => intersection(item.tags, this.selectedTags).length === this.selectedTags.length)
      //     break
      //   case 'recycle':
      //     list = this.recycle
      //     break
      //   default:
      //     list = this.latestFiles
      //     break
      // }
      // this.fileList = this.fileListSortFunc(clone(list))
    },

    selectedTags (val) {
      console.log('watch-selectedTags', val)
      let tagNotes = val.map(tagId => this.tagsMap[tagId].note_ids)
      if (tagNotes.length === 0) {
        this.list = this.fileList
      } else {
        let fileIds = tagNotes[0]
        tagNotes.forEach(item => {
          fileIds = intersection(fileIds, item)
        })
        this.list = fileIds.map(item => this.allFileMap[item])
      }
    },

    fileList (val, oldVal) {
      // console.log('fileList', val, oldVal)
      // if (oldVal.length === 0 && this.viewFileType === 'latest') {
      //   this.selectFile(0)
      //   this.$nextTick(() => {
      //     this.$refs.body.scrollTo(0, 0)
      //   })
      // }
      // // val.forEach((item, index) => {
      // //   this.$set(this.list, index, item)
      // // })
      // this.list = val
    },

    list (val) {
      // console.log('watch-list', val)
      return
    },

    latestFiles (val) {
      // console.log('watch-latestFiles', val)
      return
      if (this.viewFileType === 'latest') {
        this.fileList = this.fileListSortFunc(clone(val))
      }
    },

    files (val) {
      // console.log('watch-files', val)
      return
      if (this.viewFileType === 'folders' || this.viewFileType === 'new folder') {
        this.fileList = this.fileListSortFunc(clone(val))
      }
    },

    recycle (val) {
      return
      if (this.viewFileType === 'recycle') {
        this.fileList = this.fileListSortFunc(clone(val))
      }
    },

    viewFolder (val, oldVal) {
      return
      if (this.fileList.length > 0) {
        this.selectFile(0)
      } else {
        this.SET_CURRENT_FILE('')
      }
      this.list = this.fileList
      this.$nextTick(() => {
        this.$refs.body.scrollTo(0, 0)
      })
    },

    viewFileSortType (val) {
      console.log('viewFileSortType', val)
      return
      this.list = this.fileListSortFunc(this.list)
    },

    viewFileSortOrder (val) {
      console.log('viewFileSortOrder', val)
      return
      this.list = this.fileListSortFunc(this.list)
    },

    stickTopFiles (val) {
      console.log('stickTopFiles', val)
      return
      this.fileList = this.fileListSortFunc(this.list)
    }
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
      'SET_VIEW_FILE_LIST_TYPE',
      'SET_VIEW_FILE_SORT_TYPE',
      'SET_VIEW_FILE_SORT_ORDER',
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    selectFile (index) {
      const file = this.list[index]
      console.log('selectFile', index, file, this.list)
      if (!file) {
        this.SET_CURRENT_FILE(null)
        return
      }
      this.$refs.fileCardGroup.select(index) // visually select file
      if (this.currentFile !== file) {
        this.SET_CURRENT_FILE(file.id)
      }
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
      let topList = this.stickTopFiles.map(id => {
        return this.allFileMap[id]
      }).filter(file => list.indexOf(file) > -1)

      let order = this.viewFileSortOrder === 'down' ? -1 : 1
      let downList = list.sort((a, b) => {
        return (Number(a[this.viewFileSortType]) - Number(b[this.viewFileSortType])) * order
      }).filter(file => this.stickTopFiles.indexOf(file.id) === -1)

      console.log('fileListSortFunc', topList, downList)
      return [...topList, ...downList]
    },

    getParentFolderTitle (file) {
      let parentFolderId = file.parent_folder
      return parentFolderId !== '/' ? this.allFileMap[parentFolderId].title : '我的文件夹'
      // let parentFolderId = folders[folders.length - 1]
      // if (parentFolderId && this.folders[parentFolderId]) {
      //   return this.folders[parentFolderId].title
      // }
      // return ''
    },

    newDoc () {
      this.$hub.dispatchHub('newDoc', this)
    },

    handleContextmenu (props) {
      console.log('handleContextmenu-11', props, this.nativeMenus)
      this.popupedFile = props.file_id
      if (props.type === 'doc') {
        let idx = this.stickTopFiles.indexOf(props.file_id) === -1 ? 0 : 1
        this.popupNativeMenu(this.nativeMenus[idx])
      } else if (props.type === 'folder') {
        this.popupNativeMenu(this.nativeMenus[2])
      }
    },

    handleStickTop () {
      this.STICK_TOP_FILE(this.popupedFile)
    },

    handleCancelStickTop () {
      this.CANCEL_STICK_TOP_FILE(this.popupedFile)
    },

    handleRename () {
      this.$hub.dispatchHub('renameFileCard', this, this.currentFile.id)
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
    },

    getCurrentFiles (currentFolder) {
      if (!currentFolder) {
        console.log('getCurrentFiles', this.latestFiles, this.rootFiles)
        return this.rootFiles
      } else {
        const childFolders = currentFolder.children || []
        const childDocs = currentFolder.child_docs || []

        return [...childFolders, ...childDocs]
          .filter(file => !file.trash)
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
</style>
