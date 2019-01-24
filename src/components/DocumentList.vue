<template>
  <div class="document-list">
    <div class="header">
      <div class="button button-back" @click="handleBack"></div>
      <span class="title ellipsis">{{ viewName }}</span>
      <div class="button button-listtype expand" @click="handleList">
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
    <div class="body">
      <ul>
        <li
          :class="{'selected': currentFile === item}"
          v-for="(item, index) in fileList"
          :key="index"
          @click="selectFile(item)">
          <FileCard
            :mini="viewFileListType === 'list'"
            :type="item.type"
            :title="item.title"
            :content="item.content"
            :update_at="item.update_at | yyyymmdd"
            :file_size="Number(item.file_size)"
            :file_path="item.file_path">
          </FileCard>
        </li>
      </ul>
    </div>
    <div class="footer">
      <div class="num">
        总计 {{ fileList.length }} 项
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { readFile } from '@/utils/file'
import { mapGetters, mapState, mapActions } from 'vuex'
import FileCard from './FileCard'

export default {
  name: 'DocumentList',

  components: {
    FileCard
  },

  data () {
    return {
      isMenuVisible: false,
      menuData: [
        {
          label: '摘要',
          value: 'summary',
          type: 'check'
        },
        {
          label: '列表',
          value: 'list',
          type: 'check'
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
    },

    sortFiles (fileList) {
      console.log('sortFiles', fileList)
      switch (this.viewFileListType) {
        case 'create_at':
          return fileList.sort((a, b) => {
            return Number(a.create_at) - Number(b.create_at)
          })
        case 'update_at':
          return fileList.sort((a, b) => {
            return Number(a.update_at) - Number(b.update_at)
          })
        case 'file_size':
          return fileList.sort((a, b) => {
            return Number(a.file_size) - Number(b.file_size)
          })
      }
    }
  },

  computed: {
    ...mapState({
      views: state => state.views
    }),
    ...mapGetters({
      viewName: 'GET_VIEW_NAME',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      latesFiles: 'GET_LATEST_FILES',
      folders: 'GET_FOLEDERS',
      recycle: 'GET_RECYCLE',
      files: 'GET_CURRENT_FILES',
      currentFile: 'GET_CURRENT_FILE',
      viewFileListType: 'GET_VIEW_FILE_LIST_TYPE',
      viewFileSortType: 'GET_VIEW_FILE_SORT_TYPE'
    }),

    fileList () {
      let list = []
      switch (this.viewFileType) {
        case 'latest':
          list = this.latesFiles
          break
        case 'folders':
          list = this.files
          break
        case 'new folder':
          list = this.files
          break
        case 'recycle':
          list = this.recycle
          break
        default:
          list = this.latesFiles
          break
      }
      return this.fileListSortFunc(list)
    }
  },

  watch: {
    fileList (val) {
      if (this.fileList.length > 0) {
        this.selectFile(this.fileList[0])
      }
    }
  },

  methods: {
    ...mapActions([
      'SET_EDITOR_CONTENT',
      'EDIT_FILE',
      'SET_CURRENT_FILE',
      'SET_VIEW_FILE_LIST_TYPE',
      'SET_VIEW_FILE_SORT_TYPE'
    ]),

    selectFile (item) {
      // if (!item) return
      console.log('selectFile', this.currentFile, item)
      if (this.currentFile === item) return
      const appPath = '/Users/bowiego/Documents/workspace/enote/public'

      console.log('save-data')
      // this.SAVE_EDITOR_CONTENT()
      if (this.currentFile && this.currentFile.type === 'doc') {
        this.$hub.$emit('saveEditorContent')
      }
      // this.currentFileTempId = item.id
      // this.currentFile = item
      // if (this.currentFile) {
      //   console.log('currentFile', this.currentFile.id)
      // }
      this.SET_CURRENT_FILE(item.id)
      if (item.type === 'doc') {
        readFile(`${appPath}/docs/${item.id}.xml`).then(data => {
          this.SET_EDITOR_CONTENT(data.data)
          // this.EDIT_FILE({
          //   id: item.id,
          //   attr: 'file_size',
          //   val: data.size
          // })
          // console.log(data)
        })
      }
    },

    handleBack () {
      this.$hub.$emit('navUp')
    },

    handleList () {
      this.isMenuVisible = !this.isMenuVisible
    },

    handleMenuClick (value, item) {
      console.log('handleMenuClick', value)
      if (value === 'summary' || value === 'list') {
        this.SET_VIEW_FILE_LIST_TYPE(value)
      } else {
        this.SET_VIEW_FILE_SORT_TYPE(value)
      }
      // if (index === 0) {
      //   this.$hub.$emit('newDoc')
      // } else if (index === 1) {
      //   this.$hub.$emit('newFolder')
      // }
    },

    fileListSortFunc (list) {
      console.log('fileListSortFunc', list)
      switch (this.viewFileSortType) {
        case 'create_at':
          return list.sort((a, b) => {
            return Number(b.create_at) - Number(b.create_at)
          })
        case 'update_at':
          return list.sort((a, b) => {
            return Number(b.update_at) - Number(a.update_at)
          })
        case 'file_size':
          return list.sort((a, b) => {
            return Number(b.file_size) - Number(a.file_size)
          })
        default:
          return list
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
    .title
      flex .85
      text-align center
      font-size 14px

.body
  height 100%
  padding-bottom 100px
  overflow-y scroll
  ul
    li.selected
      background-color #eff0f1

.footer
  width 100%
  position absolute
  bottom 0
  border-top 1px solid #e6e6e6
  background-color #fff
  .num
    height 40px
    line-height 40px
    padding-left 20px
    font-size 12px
    letter-spacing 1px

.button
  width 40px
  height 24px
  border-radius 4px
  border 1px solid #dedede
  &.expand
    position relative
    &::after
      content ''
      display block
      width 0
      height 0
      position absolute
      top 50%
      right 6px
      border-top 2.8px solid transparent
      border-left 4.5px solid #a1a1a1
      border-bottom 2.8px solid transparent
      transform  translateY(-50%) rotate(90deg)
  // &.button-back
  // &.button-listtype
</style>
