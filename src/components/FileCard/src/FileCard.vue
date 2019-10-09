<template>
  <div class="file-card"
    :class="{ mini : mini, selected : selected, absence: isAbsence }"
    @click="handleClick"
    @dblclick="handleDbClick"
    :draggable="isDraggable"
    @dragstart='dragStart'
    @contextmenu="handleContextmenu">
    <div class="header">
      <div class="icon" :class="type"></div>
      <div class="title ellipsis"
        :class="{ folder : viewFileType !== 'recycle' && type === 'folder' }">
        <input v-show="showTitleInput"
          ref="titleInput"
          type="text"
          v-model="titleValue"
          @blur="handleTitleInputBlur"
          @keyup.enter="handleTitleInputBlur">
        <span v-for="(item, index) in titleStrArr"
          :key="index"
          :class="{ highlight : item === searchKeyword }"
          v-show="!showTitleInput"
          ref="title"
          @click.stop="handleClickTitle">
          {{ item }}
        </span>
      </div>
      <div class="icon-stack">
        <div class="absence_icon" v-if="isAbsence"></div>
        <div class="icon stick-top" v-if="isTop"></div>
        <div class="isShared" v-if="isShared"></div>
        <div class="isPushing infinite rotate animated" v-if="isPushing"></div>
        <div class="need_push" v-if="need_push"></div>
        <div class="need_push local" v-if="need_push_local"></div>
      </div>
    </div>
    <div class="body" v-if="content.length > 0 && !mini && type === 'note'">
      <p class="content">{{ content }}</p>
    </div>
    <div class="footer">
      <div class="path" v-if="!mini && selected && viewFileType === 'latest'">
        {{ parent_folder }}
      </div>
      <span class="username" v-if="isUserShowed">{{ username }}</span>
      <span class="time" v-if="isTimeShowed">{{ update_at }}</span>
      <span class="size" v-if="isSizeShowed">{{ file_size | size }}</span>
    </div>
    <modal
      :visible.sync="isRenameConfirmShowed"
      width="300px"
      height="90px"
      body-height="100%"
      top="30vh"
      style="padding-bottom:20px "
      transition-name="fade-in-down"
      @close="isRenameConfirmShowed = false"
      title="重命名">
        <div style="text-align:center;padding:10px; 0">
          <p>目录中有重名文件夹，是否重命名为：{{ newTitle }}？</p>
        </div>
        <div class="button-group button-container" slot="footer">
          <div class="button primary" @click="confirmRename">是</div>
          <div class="button" @click="isRenameConfirmShowed = false">否</div>
        </div>
    </modal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'
import fetchLocal from '../../../utils/fetchLocal'
import { handleNameConflict } from '../../../utils/utils'
import icon64 from '@/assets/images/icon64'

export default {
  name: 'FileCard',

  mixins: mixins,

  data () {
    return {
      selected: false,
      titleValue: '',
      newTitle: '',
      isRenameConfirmShowed: false,
      titleEllipsis: '',
      showTitleInput: false
    }
  },

  props: {
    mini: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'doc'
    },
    file_id: {
      type: String
    },
    pid: {
      type: String
    },
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    update_at: {
      type: String,
      default: ''
    },
    file_size: {
      type: Number,
      default: 0
    },
    username: {
      type: String,
      default: ''
    },
    parent_folder: {
      type: String
    },
    isTop: {
      type: Boolean,
      default: false
    },
    isShared: {
      type: Boolean,
      default: false
    },
    need_push: {
      type: Boolean,
      default: false
    },
    need_push_local: {
      type: Boolean,
      default: false
    },
    isPushing: {
      type: Boolean,
      default: false
    },
    isDraggable: {
      type: Boolean,
      default: true
    },
    rawData: {
      type: Object,
      default: () => { return {} }
    },
    isTrash: {
      type: String
    }
  },

  computed: {
    ...mapGetters({
      viewFileType: 'GET_VIEW_FILE_TYPE',
      searchKeyword: 'GET_SEARCH_KEYWORD',
      currentNav: 'GET_CURRENT_NAV'
    }),

    isAbsence () {
      if (this.type === 'note' && this.currentNav.type === 'share') {
        if (!this.isShared || this.isTrash !== 'NORMAL') {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    },
    isTimeShowed () {
      if (this.viewFileType === 'latest') {
        return this.mini || !this.selected
      } else {
        return true
      }
    },

    isSizeShowed () {
      if (this.type === 'folder') return false
      if (this.viewFileType === 'latest') {
        return !this.mini && !this.selected
      } else {
        return !this.mini
      }
    },

    isUserShowed () {
      if (this.type === 'folder') return false
      if (this.currentNav.type === 'public' || this.currentNav.type === 'share') {
        return !this.mini && !this.selected
      } else {
        return false
      }
    },

    titleStrArr () {
      let title = this.titleEllipsis
      let arr = []
      let re = new RegExp(this.searchKeyword, 'g')
      if (this.searchKeyword === '') {
        return [title]
      }

      while (title.search(re) > -1) {
        let idx = title.search(re)
        let strPre = title.substring(0, idx)
        if (strPre !== '') {
          arr.push(strPre)
        }
        arr.push(this.searchKeyword)
        title = title.slice(idx + this.searchKeyword.length, title.length)
      }
      arr.push(title)
      return arr
    }
  },

  watch: {
    title (val) {
      this.titleEllipsis = val.length > 26
        ? val.slice(0, 26) + '...'
        : val
      this.titleValue = val
    }
  },

  filters: {
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

  created () {
    this.titleValue = this.title
    this.titleEllipsis = this.title.length > 26
      ? this.title.slice(0, 26) + '...'
      : this.title
  },

  mounted () {
    // console.log(this.currentNav)
    this.$on('select', index => {
      if (this.$vnode.key === index) {
        this.selected = true
      }
    })
    this.$on('cancelSelect', () => {
      this.selected = false
    })
  },

  methods: {
    ...mapActions([
      'EDIT_FILE',
      'DELETE_FILE',
      'SET_DRAGGING_FILE'
    ]),

    handleClick () {
      this.dispatch('FileCardGroup', 'item-click', this)
      this.selected = true
      this.$emit('handleClick', this)
    },

    handleDbClick () {
      this.$emit('dblclick', this)
    },

    handleClickTitle () {
      if (this.type === 'folder') {
        this.dispatch('FileCardGroup', 'item-title-click', this)
      } else {
        this.handleClick()
      }
    },

    handleContextmenu () {
      this.$emit('contextmenu', this.$options.propsData)
    },

    handleTitleInputBlur (e) {
      if (e.keyCode === 13) {
        this.$refs.titleInput.blur()
        return
      }
      if (this.titleValue === this.title) {
        return
      }

      this.showTitleInput = false
      let fileList = this.$root.$documentList.fileList
      let fileTitleList = fileList.filter(item => item.type === this.type).map(item => item.title)

      if (fileTitleList.indexOf(this.titleValue) > -1) {
        this.newTitle = handleNameConflict(this.titleValue, this.title, fileTitleList)
        this.isRenameConfirmShowed = true
        return
      } else {
        this.newTitle = this.titleValue
      }

      this.handleRename()
    },

    handleRename () {
      let taskName = this.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'

      fetchLocal(taskName, {
        id: this.file_id,
        title: this.newTitle
      }).then(res => {
        if (res.type === 'folder') {
          this.$hub.dispatchHub('updateFile', this, {
            id: res._id,
            name: res.title
          })
        }
      })
    },

    confirmRename () {
      this.handleRename()
      this.isRenameConfirmShowed = false
    },

    dragStart (e) {
      let img = new Image()
      img.src = icon64[this.type]
      e.dataTransfer.setDragImage(img, 0, 0)
      this.SET_DRAGGING_FILE(this.rawData)
    }
  }
}
</script>

<style lang="stylus" scoped>
.file-card
  width 100%
  padding 14px 20px
  border-bottom 1px solid #E9E9E9
  &.selected
    background-color #FFF5E2
  &.mini
    height 50px
    display flex
    flex-direction row
    justify-content space-between
    align-items center
    .footer
      width 100px
      margin 0
  &.absence
    background #F7F5EC
    opacity 0.4
.header
  position relative
  width inherit
  display flex
  flex-direction row
  align-items center
  .title
    margin-left 10px
    font-size 13px
    span
      float left
    span.highlight
      background-color yellow
    &.folder:hover
      span
        text-decoration underline
    input
      border none
      background-color transparent
      outline-color #6cb5f9
      color inherit
      font-size inherit
      font-weight inheirht
      font-family inherit
      &:focus
        background-color #fff

.icon
  width 18px
  height 18px
  border-radius 3px
  background-image url(../../../assets/images/lanhu/doc@2x.png)
  background-repeat no-repeat
  background-position center
  background-size contain
  &.folder
    background-image url(../../../assets/images/lanhu/folder@2x.png)
  &.stick-top
    width 16px
    height 16px
    background-image url(../../../assets/images/lanhu/stick_top@2x.png)

.icon-stack
  // width 100%
  height 100%
  display flex
  flex-direction row
  justify-content flex-end
  align-items center
  div
    margin-left 10px

.drag-icon
  width 36px
  height 36px
  background-color #eee
  display flex
  align-items center
  justify-content center
  .icon
    width 26px
    height 26px

.need_push, .isPushing
  right 50px
  width 16px
  height 16px
  border-radius 50%
  background-image url(../../../assets/images/lanhu/sync@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center
  opacity .6
  &.local
    background-color green
.absence_icon
  right 50px
  width 16px
  height 16px
  background-image url(../../../assets/images/lanhu/absence@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center
.isShared
  right 50px
  width 16px
  height 16px
  background-image url(../../../assets/images/lanhu/FileCardShare@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center

.body
  margin: 6px 0
  display flex
  align-items center
  color #696969
  .content
    display inline-block
    width 100%
    height 36px
    font-size 12px
    overflow hidden
    text-overflow ellipsis
    word-break break-all
    display -webkit-box
    -webkit-box-orient vertical
    -webkit-line-clamp 2

.footer
  margin 10px 0 0
  font-size 11px
  font-weight 500
  color #808080
  .size
    margin-left 10px
  .username
    margin-right 10px
  .path
    display flex
    flex-direction row
    align-items center
    &::before
      content ''
      display block
      margin-right 6px
      width 16px
      height 16px
      background-image url(../../../assets/images/folder-open-fill.png)
      background-repeat no-repeat
      background-size contain
      background-position center
</style>
