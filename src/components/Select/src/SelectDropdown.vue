<template>
  <div class="b-select-dropdown">
    <div class="b-select-dropdown__wrap">
      <slot></slot>
      <div class="dropdown__arrow"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BSelectDropdown'
}
</script>

<style lang="stylus" scoped>
.b-select-dropdown
  min-width 20%
  // padding-right 10px
  position absolute
  top 40px
  left 0
  margin 5px 0
  background-color #fff
  // border 1px solid #DDAF59
  border-radius 2px
  box-shadow 0 2px 12px 0 rgba(0,0,0,.1)
  z-index 9999
  color #333
  // box-sizing unset
.b-select-dropdown__wrap
  width 100%
  height 100%
  position relative
.dropdown__arrow
  width 0
  height 0
  position absolute
  top -9px
  left 14px
  border-width 9px
  border-top-width 0
  border-style solid
  border-color transparent
  // border-bottom-color #DDAF59
  filter drop-shadow(0 2px 12px rgba(0, 0, 0, .03))
  &::after
    content " "
    top 1px
    margin-left -9px
    border-width 9px
    border-top-width 0
    border-color transparent
    border-bottom-color #fff
    border-style solid
    position absolute
    display block
    width 0
    height 0
    // border-style solid
</style>
