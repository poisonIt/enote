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
          :mini="viewFileListType === 'list'"
          :file_id="item.id"
          :type="item.type"
          :title="item.title"
          :content="item.brief"
          :update_at="item.update_at | yyyymmdd"
          :file_size="Number(item.file_size || 0)"
          :parent_folder="getParentFolder(item.ancestor_folders)"
          @contextmenu="handleContextmenu">
        </FileCard>
      </FileCardGroup>
      <div class="no-file" v-if="fileList.length === 0">
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
import { fileHandleMenu, fileCloudMenu, fileInfoMenu } from '../Menu'
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
      nativeMenuData: [
        fileHandleMenu,
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
      latestFiles: 'GET_LATEST_FILES',
      folders: 'GET_FOLEDERS',
      recycle: 'GET_RECYCLE_FILES',
      files: 'GET_CURRENT_FILES',
      currentFolder: 'GET_CURRENT_FOLDER',
      currentFile: 'GET_CURRENT_FILE',
      viewFolder: 'GET_VIEW_FOLDER',
      viewFileListType: 'GET_VIEW_FILE_LIST_TYPE',
      viewFileSortType: 'GET_VIEW_FILE_SORT_TYPE',
      viewFileSortOrder: 'GET_VIEW_FILE_SORT_ORDER',
      selectedTags: 'GET_SELECTED_TAGS'
    })
  },

  watch: {
    viewFileType (val) {
      let currentFiles = this.getCurrentFiles(this.currentFolder)
      let list = []
      switch (val) {
        case 'latest':
          list = this.latestFiles
          break
        case 'folders':
          list = currentFiles
          break
        case 'new folder':
          list = currentFiles
          break
        case 'tags':
          if (this.selectedTags.length === 0) {
            list = this.latestFiles
            break
          }
          list = this.latestFiles.filter(item => intersection(item.tags, this.selectedTags).length === this.selectedTags.length)
          break
        case 'recycle':
          list = this.recycle
          break
        default:
          list = this.latestFiles
          break
      }
      this.fileList = this.fileListSortFunc(clone(list))
    },

    selectedTags (val) {
      console.log('watch-selectedTags', val)
      let list = []
      if (this.viewFileType === 'tags') {
        if (val.length === 0) {
          list = this.latestFiles
        } else {
          list = this.latestFiles.filter(item => intersection(item.tags, val).length === val.length)
        }
      } else {
        return
      }
      this.fileList = this.fileListSortFunc(clone(list))
    },

    fileList (val, oldVal) {
      console.log('fileList', val)
      if (oldVal.length === 0 && this.viewFileType === 'latest') {
        this.selectFile(0)
        this.$nextTick(() => {
          this.$refs.body.scrollTo(0, 0)
        })
      }
      // val.forEach((item, index) => {
      //   this.$set(this.list, index, item)
      // })
      this.list = val
    },

    latestFiles (val) {
      if (this.viewFileType === 'latest') {
        this.fileList = this.fileListSortFunc(clone(val))
      }
    },

    files (val) {
      if (this.viewFileType === 'folders' || this.viewFileType === 'new folder') {
        this.fileList = this.fileListSortFunc(clone(val))
      }
    },

    recycle (val) {
      if (this.viewFileType === 'recycle') {
        this.fileList = this.fileListSortFunc(clone(val))
      }
    },

    viewFolder (val, oldVal) {
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
      this.list = this.fileListSortFunc(this.list)
    },

    viewFileSortOrder (val) {
      this.list = this.fileListSortFunc(this.list)
    }
  },

  methods: {
    ...mapActions([
      'SAVE_DOC',
      'SET_EDITOR_CONTENT',
      'EDIT_FILE',
      'SET_CURRENT_FILE',
      'SET_VIEW_FILE_LIST_TYPE',
      'SET_VIEW_FILE_SORT_TYPE',
      'SET_VIEW_FILE_SORT_ORDER',
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    selectFile (index) {
      const file = this.fileList[index]
      console.log('selectFile', file, this.contentCache)
      if (!this.isFirstSelect) {
        if (this.currentFile === file) return
        if (this.currentFile) {
          this.SAVE_DOC({
            id: this.currentFile.id,
            html: this.contentCache
          })
        }
      } else {
        this.isFirstSelect = false
      }
      this.$refs.fileCardGroup.select(index) // visually select file
      // const appPath = '/Users/bowiego/Documents/workspace/enote/public'

      this.SET_CURRENT_FILE(file.id)
      if (file.type === 'doc') {
        LocalDAO.doc.get(file.id).then(res => {
          console.log('SET_EDITOR_CONTENT', res)
          this.SET_EDITOR_CONTENT(res)
        })
        // readFile(`${appPath}/docs/${file.id}.xml`).then(data => {
        //   this.SET_EDITOR_CONTENT(data.data)
        // })
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

    fileListSortFunc (list) {
      let order = this.viewFileSortOrder === 'down' ? -1 : 1
      return list.sort((a, b) => {
        return (Number(a[this.viewFileSortType]) - Number(b[this.viewFileSortType])) * order
      })
    },

    getParentFolder (folders) {
      let parentFolderId = folders[folders.length - 1]
      if (parentFolderId && this.folders[parentFolderId]) {
        return this.folders[parentFolderId].title
      }
      return ''
    },

    newDoc () {
      this.$hub.dispatchHub('newDoc', this)
    },

    handleContextmenu (props) {
      console.log('handleContextmenu-11', props, this.nativeMenus)
      this.popupedFile = props.file_id
      this.popupNativeMenu(this.nativeMenus[0])
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
      const childFolders = currentFolder.child_folders || []
      const childDocs = currentFolder.child_docs || []

      return [...childFolders, ...childDocs]
        .map(id => this.allFileMap[id])
        .filter(file => !file.discarded)
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
