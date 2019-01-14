<template>
  <div class="container">
    <div class="header">
      <div class="button button-back"></div>
      <span class="title ellipsis">{{ viewName }}</span>
      <div class="button button-listtype expand"></div>
    </div>
    <div class="body">
      <ul>
        <li
          v-for="(item, index) in fileList"
          :key="index">
          <FileCard
            :type="item.type"
            :title="item.title"
            :content="item.content"
            :update_at="item.update_at | yyyymmdd"
            :file_size="item.file_size"
            :file_path="item.file_path">
          </FileCard>
        </li>
      </ul>
    </div>
    <div class="footer"></div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { mapGetters, mapState } from 'vuex'
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
      recycle: 'GET_RECYCLE'
    }),

    fileList () {
      switch (this.viewFileType) {
        case 'latest':
          return this.latesFiles
        case 'folders':
          return this.folders
        case 'recycle':
          return this.recycle
        default:
          return this.latesFiles
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  width 100%
  .header
    width inherit
    height 59px
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
