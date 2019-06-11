<template>
  <div class="container"
    ref="container"
    v-if="currentFile"
    @dblclick.self="handleHeaderDbClick"
    :style="{ width: containerWidth }">
    <div class="title" :class="{ disable : viewFileType === 'recycle' }">
      <input
        ref="input"
        type="text"
        v-model="titleValue"
        :disabled="isTrash"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keyup.enter="handleInputEnter">
      <p class="ellipsis">{{ titleValue }}</p>
    </div>
    <div class="handler" v-show="!isTrash">
      <div class="handler-item"
        :class="{ hidden: isHandlerHidden(item) }"
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
          <div class="item" @click="handleRemove">删除笔记</div>
          <div class="item" @click="showHistory">查看历史版本</div>
        </div>
      </transition>
      <transition name="fade-in-down">
        <div class="info" v-show="isInfoShowed">
          <div class="item">
            <span>名称：</span>
            <span>{{ currentFile.title }}</span>
          </div>
          <div class="item">
            <span>作者：</span>
            <span>{{ userInfo.account_name_cn || userInfo.username }}</span>
          </div>
          <div class="item" v-if="currentFile.content">
            <span>字数：</span>
            <span>{{ currentFile.content.length }}</span>
          </div>
          <div class="item">
            <span>创建时间：</span>
            <span>{{ currentFile.create_at | date }}</span>
          </div>
          <div class="item">
            <span>修改时间：</span>
            <span>{{ currentFile.update_at | date }}</span>
          </div>
          <div class="item">
            <span>位置：</span>
            <span>{{ path }}</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import dayjs from 'dayjs'
import * as _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'
// import {
//   updateLocalFolder,
//   updateLocalNote
// } from '@/service/local'

export default {
  name: 'FileHandler',

  data () {
    return {
      currentFileTitle: '',
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
      userInfo: 'GET_USER_INFO',
      allFileMap: 'GET_FILES',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      isTagShowed: 'GET_SHOW_TAG_HANDLER'
    }),

    isTrash () {
      return this.currentFile && this.currentFile.trash !== 'NORMAL'
    },

    path () {
      let result = ''
      let pNode
      let folderMap = this.$root.$navTree.model.store.map
      pNode = folderMap[this.currentFile.pid]
      while (pNode !== null && pNode !== undefined) {
        result = '/' + pNode.name + result
        pNode = folderMap[pNode.pid]
      }
      return result
    }
  },

  watch: {
    viewType (val) {
      this.handleResize()
    },

    currentFile: {
      handler: function (val) {
        this.isInfoShowed = false
        this.isMoreShowed = false
        if (val) {
          this.titleValue = val.title
          this.currentFileTitle = val.title
        }
      },
      deep: true
    }
  },

  filters: {
    date (timeStamp) {
      return dayjs(Number(timeStamp)).format('YYYY.MM.DD. hh:mm')
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
      'EDIT_FILE',
      'TOGGLE_SHOW_TAG_HANDLER',
      'TOGGLE_SHOW_SHARE_PANEL',
      'TOGGLE_SHOW_RESEARCH_PANEL',
      'SET_SHARE_INFO'
    ]),

    handleInputFocus () {
      this.isInputFocused = true
    },

    handleInputEnter () {
      this.$refs.input.blur()
    },

    async handleInputBlur () {
      this.isInputFocused = false
      if (this.titleValue === this.currentFileTitle) return
      let fileList = this.$root.$documentList.fileList
      let files = _.find(fileList, { title: this.titleValue, type: this.currentFile.type })
      if (files) {
        this.titleValue = this.currentFile.title
        return
      }
      this.currentFileTitle = this.titleValue
      this.$hub.dispatchHub('updateFile', this, {
        id: this.currentFile._id,
        name: this.titleValue
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
    },

    isHandlerHidden (item) {
      if (item === 'fetch') {
        return false
      } else if (this.currentFile.type === 'folder') {
        return true
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
      this.TOGGLE_SHOW_RESEARCH_PANEL(true)
    },

    search () {
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
      ipcRenderer.send('create-preview-window', {
        noteId: this.currentFile._id,
        title: this.currentFileTitle
      })
    },

    showInfo () {
      this.isInfoShowed = !this.isInfoShowed
    },

    handleExport () {
    },

    handleRemove () {
      this.$hub.dispatchHub('removeFile', this, {
        id: this.currentFile._id
      })
    },

    showHistory () {
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
  -webkit-app-region no-drag
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

.hidden
  display none

.handler
  // width 40%
  display flex
  position relative
  justify-content space-between
  -webkit-app-region no-drag

.icon
  width 15px
  height 15px
  background-size contain
  background-position center
  background-repeat no-repeat
  margin 0 5px
  &.icon-share
    background-image url('../../../assets/images/lanhu/share@2x.png')
  &.icon-fetch
    background-image url('../../../assets/images/lanhu/fetch@2x.png')
  &.icon-search
    background-image url('../../../assets/images/lanhu/search@2x.png')
  &.icon-tag
    background-image url('../../../assets/images/lanhu/tag_grey@2x.png')
  &.icon-more
    background-image url('../../../assets/images/lanhu/more@2x.png')
  &.icon-window
    background-image url('../../../assets/images/lanhu/window@2x.png')
  &.icon-info
    background-image url('../../../assets/images/lanhu/info@2x.png')

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
  z-index 99999
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
  padding 20px 20px 10px 20px
  right 10%
  white-space nowrap
  .item
    font-size 12px
    line-height 12px
    margin-bottom 16px
    span:nth-of-type(1)
      display inline-block
      width 60px
      text-align right
      margin-right 4px
      color #999999
</style>
