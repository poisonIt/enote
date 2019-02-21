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
        :key="index">
        <div class="icon"
          :class="iconClassComputed(item)"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'FileHandler',

  data () {
    return {
      containerWidth: '0px',
      titleValue: '',
      isInputFocused: false,
      handlers: ['share', 'fetch', 'search', 'tag', 'more', 'window', 'info']
    }
  },

  computed: {
    ...mapGetters({
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE',
      viewFileType: 'GET_VIEW_FILE_TYPE'
    })
  },

  watch: {
    viewType (val) {
      this.handleResize()
    },

    currentFile (val) {
      if (val) {
        this.titleValue = val.title
      }
    }
  },

  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },

  methods: {
    ...mapActions(['SAVE_FILE_TITLE']),

    handleInputBlur () {
      this.isInputFocused = false
      this.SAVE_FILE_TITLE({
        id: this.currentFile.id,
        title: this.titleValue
      })
    },

    handleResize () {
      this.$nextTick(() => {
        let space = this.viewType === 'expanded' ? 500 : 360
        this.containerWidth = document.body.clientWidth - space + 'px'
      })
    },

    iconClassComputed (key) {
      return 'icon-' + key
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  // width 100%
  height 60px !important
  position absolute
  top 40px
  // right 0
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  border-bottom 1px solid #e6e6e6
  padding: 0 20px

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
  display flex
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
    background-image url('../assets/images/lanhu/tag@2x.png')
  &.icon-more
    background-image url('../assets/images/lanhu/more@2x.png')
  &.icon-window
    background-image url('../assets/images/lanhu/window@2x.png')
  &.icon-info
    background-image url('../assets/images/lanhu/info@2x.png')
</style>
