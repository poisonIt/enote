<template>
  <div class="app-header">
    <div class="tools">
      <div class="avatar">
        <img src="https://avatar.saraba1st.com/images/noavatar_middle.gif" alt="">
      </div>
      <div class="sync"></div>
      <div class="view">
        <div class="button"
          :class="{ actived : isViewButtonActived('expanded') }"
          @click="changeViewType('expanded')">
        </div>
        <div class="button"
          :class="{ actived : isViewButtonActived('unexpanded') }"
          @click="changeViewType('unexpanded')">
        </div>
      </div>
    </div>
    <div class="title">汇添富金融云笔记</div>
    <div class="search">
      <input type="text" v-model="searchText">
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'AppHeader',

  data () {
    return {
      searchText: '',
      viewType: 'expanded'
    }
  },

  methods: {
    ...mapActions(['SET_VIEW_TYPE']),

    isViewButtonActived (type) {
      return type === this.viewType
    },

    changeViewType (type) {
      this.viewType = type
      this.SET_VIEW_TYPE(type)
    }
  }
}
</script>

<style lang="stylus" scoped>
.app-header
  width 100%
  height 40px
  position absolute
  top 0
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  padding 0 20px
  background-color #1985D7

.tools
  display flex
  flex-direction row
  align-items center

.avatar
  width 30px
  height 30px
  border-radius 50%
  overflow hidden
  img
    width 100%
    height 100%

.sync
  width 22px
  height 22px
  background-color #fff
  margin-left 40px

.view
  display flex
  flex-direction row
  border-radius 4px
  overflow hidden
  margin-left 30px
  .button
    width 28px
    height 22px
    border none
    border-radius 0
    background-color #7EFAFF
    &.actived
      background-color #3161A3
.title
  position absolute
  top 50%
  left 50%
  transform translate(-50%, -50%)
  font-size 16px
  color #fff

.search
  width 200px
  height 24px
  border-radius 3px
  overflow hidden
  input
    width 100%
    height 100%
    border none
    outline none
    padding-left 10px
</style>
