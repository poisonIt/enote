<template>
  <div class="container">
    <div class="header">
      <div class="icon"></div>
      <div class="title">{{ title }}</div>
    </div>
    <div class="body" v-if="content.length > 0">
      <span class="content ellipsis">{{ content }}</span>
    </div>
    <div class="footer">
      <span class="time">{{ update_at }}</span>
      <span class="size">{{ file_size }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileCard',

  props: {
    type: {
      type: String,
      default: 'doc'
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
      type: String,
      default: ''
    },
    file_path: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  width 100%
  padding 10px
  border-bottom 1px solid #e6e6e6

.header
  width inherit
  display flex
  flex-direction row
  align-items center
  .title
    margin-left 10px
    font-size 13px

.icon
  width 18px
  height 18px
  border-radius 3px
  background-color #198cf0

.body
  margin: 12px 0
  display flex
  align-items center
  color #696969
  .content
    display inline-block
    width 100%
    height 18px
    font-size 12px

.footer
  margin 10px 0 0
  font-size 12px
  color #808080
  .size
    margin-left 20px
</style>
