<template>
  <div class="page-layout">
    <div class="section left">
      <slot name="left"></slot>
    </div>
    <div class="section middle">
      <slot name="middle"></slot>
    </div>
    <div class="section right">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageLayout'
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
      min-width 220px
    &.middle
      width 280px
      border-left 1px solid #e6e6e6
      border-right 1px solid #e6e6e6
    &.right
      flex 1
      div
        height 100%
</style>
