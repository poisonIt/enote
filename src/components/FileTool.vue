<template>
  <div class="container">
    <div class="item expand">
      <div class="icon icon-newfile"></div>
      <span>新建</span>
    </div>
    <div class="item">
      <div class="icon icon-upload"></div>
      <span>上传</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileTool'
}
</script>

<style lang="stylus" scoped>
.container
  border-bottom 1px solid #e6e6e6

.container, .item
  display flex
  flex-direction row
  align-items center
.item
  flex 1
  height 58px
  font-size 14px
  // justify-content space-around
  span
    // display inline-block
    // flex 1
    text-align center

.expand
  position relative
  &::after
    content ''
    display block
    width 0
    height 0
    position absolute
    top 50%
    right 18px
    border-top 2.8px solid transparent
    border-left 4.5px solid #a1a1a1
    border-bottom 2.8px solid transparent
    transform  translateY(-50%) rotate(90deg)

.icon
  width 18px
  height 18px
  margin 0 10px 0 22px
  border-radius 50%
  border 1px solid #6cb5f9
</style>
