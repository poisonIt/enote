<template>
  <div :class="showHeader ? 'container top' : 'container'"
    class="icon_container"
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
        :maxlength="50"
        @blur="handleInputBlur"
        @keyup.enter="handleInputEnter">
      <p class="ellipsis">{{ titleValue }}</p>
    </div>
    <div class="search" v-if="isSearchShowed">
      <span class="num">{{ 2 }}个结果</span>
      <div class="search-bar">
        <span class="icon icon-search"></span>
        <input type="text" v-model="searchKeywords" @keyup.enter="handleSearch">
        <div class="prev-button" @click="prevSearch"></div>
        <div class="next-button" @click="nextSearch"></div>
      </div>
      <div class="search-button" @click="handleSearch">完成</div>
    </div>
    <div class="handler" v-show="!isTrash && !isSearchShowed">
    <!-- <div class="handler" v-show="false"> -->
      <div class="handler-item"
        :class="{ hidden: isHandlerHidden(item.icon) }"
        v-for="(item, index) in handlers"
        :key="index"
        :data="'FileHandler-' + item.icon"
        @click="handleClick(item.icon)">
        <Poptip trigger="hover" :content="item.content" :placement="item.placement" :offset="item.offset">
          <div class="icon"
            :class="iconClassComputed(item.icon)"
            :data="'FileHandler-' + item.icon"></div>
        </Poptip>
      </div>
      <transition name="fade-in-down">
        <div class="more" v-show="isMoreShowed">
          <!-- <div class="item" @click="handleExport">导出为PDF</div> -->
          <div class="item" @click="handleRemove">删除笔记</div>
          <!-- <div class="item" @click="showHistory">查看历史版本</div> -->
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
    <modal
      :visible.sync="isConfirmShowed"
      width="300px"
      height="90px"
      body-height="100%"
      top="30vh"
      style="padding-bottom:20px "
      transition-name="fade-in-down"
      @close="closeConfirm"
      title="重命名">
        <div style="text-align:center;padding:10px; 0">
          <p>目录中有重名文件，是否重命名为：{{ newTitle }}？</p>
        </div>
        <div class="button-group button-container" slot="footer">
          <div class="button primary" @click="confirmRename">是</div>
          <div class="button" @click="closeConfirm">否</div>
        </div>
    </modal>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import dayjs from 'dayjs'
import { mapGetters, mapActions } from 'vuex'
import { handleNameConflict } from '../../../utils/utils'
// import {
//   updateLocalFolder,
//   updateLocalNote
// } from '@/service/local'

export default {
  name: 'FileHandler',

  data () {
    return {
      showHeader: false,
      currentFileTitle: '',
      containerWidth: '0px',
      titleValue: '',
      isInputFocused: false,
      // handlers: ['share', 'fetch', 'tag', 'more', 'window', 'info'],
      handlers: [
        {icon: 'shareWithMe', content: '查看分享',placement: 'bottom-start', offset: -10},
        {icon: 'share', content: '分享', placement: 'bottom-start', offset: -10},
        {icon: 'fetch', content: '研报', placement: 'bottom', offset: 0},
        // {icon: 'search', content: '搜索', placement: 'bottom', offset: 0},
        {icon: 'tag', content: '标签', placement: 'bottom', offset: 0},
        {icon: 'more', content: '更多', placement: 'bottom', offset: 0},
        {icon: 'window', content: '新窗口笔记',placement: 'bottom-end', offset: 10},
        {icon: 'info', content: '个人信息',placement: 'bottom-end', offset: 10},
      ],
      // handlers: ['share', 'fetch', 'search', 'tag', 'more', 'window', 'info'],
      isMoreShowed: false,
      isInfoShowed: false,
      isConfirmShowed: false,
      isSearchShowed: false,
      searchKeywords: '',
      newTitle: ''
    }
  },

  computed: {
    ...mapGetters({
      currentNav: 'GET_CURRENT_NAV',
      userInfo: 'GET_USER_INFO',
      allFileMap: 'GET_FILES',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      isTagShowed: 'GET_SHOW_TAG_HANDLER'
    }),

    isTrash () {
      // console.log(this.currentFile && this.currentFile.trash !== 'NORMAL')
      if (this.currentNav.type === 'share' || this.currentNav.type === 'public') {
        return true
      } else {
        return false
      }
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

  created() {
    if (this.$remote.app.appConf.platform !== 'darwin') {
      this.showHeader = true
    }
  },
  methods: {
    ...mapActions([
      'EDIT_FILE',
      'TOGGLE_SHOW_TAG_HANDLER',
      'TOGGLE_SHOW_SHARE_PANEL',
      'TOGGLE_SHOW_RESEARCH_PANEL',
      'TOGGLE_SHOW_SHARE_WITH_ME',
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
      if (this.titleValue === '') {
        this.titleValue = this.currentFileTitle
        return
      }
      if (this.titleValue === this.currentFileTitle) return
      let fileList = this.$root.$documentList.fileList
      let fileTitleList = fileList.filter(item => item.type === this.currentFile.type).map(item => item.title)

      if (fileTitleList.indexOf(this.titleValue) > -1) {
        this.newTitle = handleNameConflict(this.titleValue, this.currentFile.title, fileTitleList)
        this.isConfirmShowed = true
        return
      }
      this.currentFileTitle = this.titleValue
      this.$hub.dispatchHub('updateFile', this, {
        id: this.currentFile._id,
        name: this.titleValue
      })
    },

    confirmRename () {
      this.currentFileTitle = this.newTitle
      this.$hub.dispatchHub('updateFile', this, {
        id: this.currentFile._id,
        name: this.newTitle
      })
      this.isConfirmShowed = false
    },

    closeConfirm () {
      this.titleValue = this.currentFile.title
      this.isConfirmShowed = false
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
      // if (item === 'fetch') {
      //   // return false
      // } else if (this.currentFile.type === 'folder' || this.currentNav.type === 'share') {
      //   return true
      // }
      // return true
      if (this.userInfo.department_name !== '研究部') {
        if (item === 'fetch') {
          return true
        }
      }
      if (this.currentFile.type === 'folder' || this.currentNav.type === 'share' || this.currentNav.type === 'public') {
        return true
      }
    },

    iconClassComputed (key) {
      return 'icon-' + key
    },

    handleClick (key) {
      switch (key) {
        case 'shareWithMe':
          this.shareWithMe()
          break
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
      console.log('search')
      this.isSearchShowed = true
    },

    prevSearch () {
      console.log('prevSearch')
      this.$hub.dispatchHub('prevSearch', this)
    },

    nextSearch () {
      console.log('nextSearch')
      this.$hub.dispatchHub('nextSearch', this)
    },

    handleSearch () {
      this.$hub.dispatchHub('searchContent', this, this.searchKeywords)
    },

    share () {
      this.TOGGLE_SHOW_SHARE_PANEL(true)
    },

    shareWithMe () {
      console.log('11111')
      this.TOGGLE_SHOW_SHARE_WITH_ME(true)
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
  z-index 99
  // right 0
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  border-bottom 1px solid #e6e6e6
  padding: 0 20px
  -webkit-app-region drag
.top
  top 30px
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
  input:disabled
    background #fff
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
  .handler-item
    text-align center

.icon
  width 15px
  height 15px
  background-size contain
  background-position center
  background-repeat no-repeat
  margin 0 5px
  &.icon-shareWithMe
    background-image url('../../../assets/images/lanhu/shareWithMe@2x.png')
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

.search
  display flex
  align-items center
  .num
    display block
    min-width 48px
    line-height 27px
  .search-bar
    position relative
  .search-button
    width 42px
    margin-left 6px
    border 1px solid #d8d8d8
    border-radius 4px
    text-align center
  input
    width 160px
    height 25px
    border-radius 16px
    border 1px solid #d8d8d8
    padding-left 26px
    outline none
  .icon-search, .prev-button, .next-button
    position absolute
    top 13px
    transform translateY(-50%)
  .icon-search
    left 2px
  .prev-button
    right 22px
    width 0
    height 0
    border-top 5px solid transparent
    border-right 8px solid #a9a9a9
    border-bottom 5px solid transparent
  .next-button
    right 10px
    width 0
    height 0
    border-top 5px solid transparent
    border-left 8px solid #a9a9a9
    border-bottom 5px solid transparent

.more, .info
  position absolute
  top 24px
  background-color #fff
  border-radius 3px
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
<style lang="stylus">
.ivu-poptip-popper
  min-width 50px !important
  z-index 10000 !important
input:disabled
  background-color: #fff;
input[disabled]
  background-color: #fff;
* html input.disabled
  background-color: #fff
</style>
<style lang="stylus">
.ivu-poptip-body-content-inner
  color #333
</style>


