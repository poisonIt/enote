<template>
  <div class="page-layout">
    <div class="section left" :class="viewType" style="background-color: #3C3E44;">
      <slot name="left"></slot>
    </div>
    <div class="section middle" style="background-color: #FCFBF7;">
      <slot name="middle"></slot>
    </div>
    <div class="section right" style="position: relative">
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
      viewType: 'GET_VIEW_TYPE'
    })
  }
}
</script>

<style lang="stylus" scoped>
.page-layout
  display flex
  flex-direction row
  height 100%
  .section
    height 100%
    &.left
      width 220px
      &.unexpanded
        width 70px
      > div
        height 100%
    &.middle
      width 320px
      border-left 1px solid #e6e6e6
      border-right 1px solid #e6e6e6
      // overflow hidden
      div
        position relative
        height 100%
    &.right
      flex 1
      padding-top 60px
      div
        height 100%
</style>
