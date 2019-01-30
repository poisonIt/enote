<template>
  <div class="container"
    ref="container"
    v-if="currentFile"
    :style="{ width: containerWidth }">
    <div class="title">
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
      djojof
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
      isInputFocused: false
    }
  },

  computed: {
    ...mapGetters({
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    viewType (val) {
      this.handleResize()
    },

    currentFile (val) {
      this.titleValue = val.title
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
</style>
