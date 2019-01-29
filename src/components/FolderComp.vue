<template>
  <div class="foler-comp">
    <div class="folder-icon"></div>
  </div>
</template>

<script>
export default {
  name: 'FolderComp'
}
</script>

<style lang="stylus" scoped>
.foler-comp
  text-align center
  line-height 400px
  display flex
  align-items center
  justify-content center

.folder-icon
  width 80px
  height 80px
  opacity 0.3
  background-image url(../assets/images/folder-multiple.png)
  background-repeat no-repeat
  background-size contain
  background-position center
</style>

