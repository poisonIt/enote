<template>
  <div class="page-layout">
    <div class="section left" :class="viewType" style="background-color: #3C3E44;">
      <slot name="left"></slot>
    </div>
    <div class="section middle" style="background-color: #FCFBF7;">
      <slot name="middle"></slot>
    </div>
    <div :class="showTag && show_tag?'section right showTag':'section right'" style="position: relative">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'PageLayout',

  computed: {
    ...mapGetters({
      viewType: 'GET_VIEW_TYPE',
      isShowed: 'GET_SHOW_TAG_HANDLER',
    })
  },

  data() {
    return {
      showTag: false,
      show_tag: false
    }
  },

  watch: {
    isShowed: {
      handler: function (val) {

        if (val === true) {
          this.showTag = true
        } else {
          this.showTag = false
        }
      }
    },
  },
  created () {
    if (this.$remote.app.appConf.platform !== 'darwin') {
      this.show_tag = true
    }
  },
}
</script>

<style lang="stylus" scoped>
.page-layout
  display flex
  flex-direction row
  height 100%
  overflow hidden
  .section
    // height 100%
    &.left
      width 220px
      &.unexpanded
        width 70px
      > div
        height 100%
    &.middle
      width 320px
      height 100%
      border-left 1px solid #e6e6e6
      border-right 1px solid #e6e6e6
      padding-bottom 90px
      div
        position relative
        height 100%
    &.right
      flex 1
      height auto
      padding-top 60px
      &.showTag
        padding-bottom 36px
      div
        height 100%
</style>
