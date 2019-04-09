<template>
  <div class="container"
    ref="container"
    v-if="currentFile"
    :style="{ width: containerWidth }">
    <div class="title" :class="{ disable : viewFileType === 'recycle' }">
      <input
        :class="{ hide : !isInputFocused }"
        type="text"
        v-model="titleValue"
        @focus="isInputFocused = true"
        @blur="handleInputBlur"
        @keyup.enter="handleInputBlur">
      <p class="ellipsis">{{ titleValue }}</p>
    </div>
    <div class="handler">
      <div class="handler-item"
        v-for="(item, index) in handlers"
        :key="index"
        :data="'FileHandler-' + item"
        @click="handleClick(item)">
        <div class="icon"
          :class="iconClassComputed(item)"
          :data="'FileHandler-' + item"></div>
      </div>
      <transition name="fade-in-down">
        <div class="more" v-show="isMoreShowed">
          <div class="item" @click="handleExport">导出为PDF</div>
          <div class="item" @click="handleDelete">删除笔记</div>
          <div class="item" @click="showHistory">查看历史版本</div>
        </div>
      </transition>
      <transition name="fade-in-down">
        <div class="info" v-show="isInfoShowed">
          <div class="item">
            <span>创建于：</span>
            <span>{{ currentFile.create_at | date }}</span>
          </div>
          <div class="item">
            <span>更新于：</span>
            <span>{{ currentFile.update_at | date }}</span>
          </div>
          <div class="item">
            <span>作者：</span>
            <span>张三</span>
          </div>
          <div class="item">
            <span>文件大小：</span>
            <span>{{ currentFile.file_size | size }}</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'FileHandler',

  data () {
    return {
      containerWidth: '0px',
      titleValue: '',
      isInputFocused: false,
      handlers: ['share', 'fetch', 'search', 'tag', 'more', 'window', 'info'],
      isMoreShowed: false,
      isInfoShowed: false
    }
  },

  computed: {
    ...mapGetters({
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      isTagShowed: 'GET_SHOW_TAG_HANDLER'
    })
  },

  watch: {
    viewType (val) {
      this.handleResize()
    },

    currentFile (val) {
      if (val) {
        console.log('currentFile', val)
        this.titleValue = val.title
      }
    }
  },

  filters: {
    date (timeStamp) {
      return dayjs(Number(timeStamp)).format('YYYY年MM月DD日 hh:mm:ss')
    },

    size (val) {
      val = val + ''
      if (val.length <= 3) {
        return val + ' B'
      } else if (val.length <= 6) {
        return (parseInt(val) / 1000).toFixed(2) + ' KB'
      } else if (val.length <= 9) {
        return (parseInt(val) / 1000000).toFixed(2) + ' MB'
      } else if (val.length <= 12) {
        return (parseInt(val) / 1000000000).toFixed(2) + ' GB'
      }
    }
  },

  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })

    window.addEventListener('click', this.handleWindowClick)
  },

  destroyed () {
    window.removeEventListener('click', this.handleWindowClick)
  },

  methods: {
    ...mapActions([
      'SAVE_FILE_TITLE',
      'TOGGLE_SHOW_TAG_HANDLER',
      'TOGGLE_SHOW_SHARE_PANEL'
    ]),

    handleInputBlur () {
      this.isInputFocused = false
      this.SAVE_FILE_TITLE({
        id: this.currentFile.id,
        title: this.titleValue
      })
    },

    handleResize () {
      this.$nextTick(() => {
        let space = this.viewType === 'expanded' ? 540 : 390
        this.containerWidth = document.body.clientWidth - space + 'px'
      })
    },

    handleWindowClick (e) {
      let dataAttr = e.target.getAttribute('data')
      if (dataAttr !== 'FileHandler-info') {
        this.isInfoShowed = false
      }
      if (dataAttr !== 'FileHandler-more') {
        this.isMoreShowed = false
      }
      if (dataAttr !== 'FileHandler-tag') {
        // this.TOGGLE_SHOW_TAG_HANDLER(false)
      }
    },

    iconClassComputed (key) {
      return 'icon-' + key
    },

    handleClick (key) {
      switch (key) {
        case 'share':
          this.share()
          break
        case 'fetch':
          this.fetch()
          break
        case 'search':
          this.search()
          break
        case 'tag':
          this.showTag()
          break
        case 'more':
          this.showMore()
          break
        case 'window':
          this.newWindow()
          break
        case 'info':
          this.showInfo()
          break
        default:
          break
      }
    },

    fetch () {
      console.log('fetch')
    },

    search () {
      console.log('search')
    },

    share () {
      this.TOGGLE_SHOW_SHARE_PANEL(true)
    },

    showTag () {
      this.TOGGLE_SHOW_TAG_HANDLER(!this.isTagShowed)
    },

    showMore () {
      this.isMoreShowed = !this.isMoreShowed
    },

    newWindow () {
      console.log('newWindow')
    },

    showInfo () {
      this.isInfoShowed = !this.isInfoShowed
    },

    handleExport () {
      console.log('handleExport')
    },

    handleDelete () {
      console.log('handleDelete')
    },

    showHistory () {
      console.log('showHistory')
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  // width 100%
  height 60px !important
  position absolute
  top 0
  // right 0
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  border-bottom 1px solid #e6e6e6
  padding: 0 20px
  -webkit-app-region drag

.title
  position relative
  width 50%
  font-size 18px
  font-weight 500
  color #333
  &.disable
    opacity 0.5
    input
      display none
  input
    position absolute
    display block
    width 100%
    height 100%
    top 0
    left 0
    border none
    outline none
    font-size inherit
    font-weight inherit
    color inherit
    font-family inherit

.hide
  opacity 0

.handler
  // width 40%
  display flex
  position relative
  justify-content space-between

.icon
  width 15px
  height 15px
  background-size contain
  background-position center
  background-repeat no-repeat
  margin 0 5px
  &.icon-share
    background-image url('../assets/images/lanhu/share@2x.png')
  &.icon-fetch
    background-image url('../assets/images/lanhu/fetch@2x.png')
  &.icon-search
    background-image url('../assets/images/lanhu/search@2x.png')
  &.icon-tag
    background-image url('../assets/images/lanhu/tag_grey@2x.png')
  &.icon-more
    background-image url('../assets/images/lanhu/more@2x.png')
  &.icon-window
    background-image url('../assets/images/lanhu/window@2x.png')
  &.icon-info
    background-image url('../assets/images/lanhu/info@2x.png')

.more, .info
  position absolute
  top 24px
  background-color #fff
  box-shadow 0px 0px 6px 0px rgba(0,0,0,0.15)
  padding 10px 0
  font-size 12px
  color #333
  line-height 24px
  font-weight 600
  z-index 9999
  .item
    padding 0 10px

.more
  padding 0
  right 60px
  .item
    padding 6px 14px
  .item:hover
    background-color #DDAF59
    color #fff

.info
  // height 100px
  right 10%
  white-space nowrap
  .item
    span:nth-of-type(1)
      display inline-block
      width 50px
      text-align right
</style>
