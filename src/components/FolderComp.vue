<template>
  <div class="folder-comp">
    <div class="folder-icon"></div>
  </div>
</template>

<script>
export default {
  name: 'FolderComp'
}
</script>

<style lang="stylus" scoped>
.folder-comp
  width 100%
  height 100%
  position absolute
  top 60px
  left 0
  text-align center
  line-height 400px
  display flex
  align-items center
  justify-content center
  background-color #fff
  z-index 9999

.folder-icon
  width 80px
  height 80px
  opacity 0.3
  background-image url(../assets/images/folder-multiple.png)
  background-repeat no-repeat
  background-size contain
  background-position center
</style>

