<template>
  <div class="container">
    <div class="header">
      <div class="button button-back" @click="handleBack"></div>
      <span class="title ellipsis">{{ viewName }}</span>
      <div class="button button-listtype expand"></div>
    </div>
    <div class="body">
      <ul>
        <li
          :class="{'selected': currentFile === item}"
          v-for="(item, index) in fileList"
          :key="index"
          @click="selectFile(item)">
          <FileCard
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
      viewName: 'GET_VIEW_NAME',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      latesFiles: 'GET_LATEST_FILES',
      folders: 'GET_FOLEDERS',
      recycle: 'GET_RECYCLE',
      files: 'GET_CURRENT_FILES',
      currentFile: 'GET_CURRENT_FILE'
    }),

    fileList () {
      console.log(this.viewFileType)
      switch (this.viewFileType) {
        case 'latest':
          console.log(this.latesFiles)
          // this.selectFile(this.latesFiles[0])
          return this.latesFiles
        case 'folders':
          // return this.folders
          console.log('files', this.files)
          // this.selectFile(this.files[0])
          return this.files
        case 'new folder':
          console.log('files', this.files)
          // this.selectFile(this.files[0])
          return this.files
        case 'recycle':
          return this.recycle
        default:
          // this.selectFile(this.latesFiles[0])
          return this.latesFiles
      }
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
      'SET_CURRENT_FILE'
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
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
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
  ul
    li.selected
      background-color #eff0f1

.footer
  width 100%
  position absolute
  bottom 0
  border-top 1px solid #e6e6e6
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
