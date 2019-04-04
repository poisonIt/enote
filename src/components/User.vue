<template>
  <div class="container">
    <div class="avatar" :class="{ expanded : viewType === 'expanded' }" @click="showUserPanel">
      <img src="https://avatar.saraba1st.com/images/noavatar_middle.gif" alt="">
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'User',

  computed: {
    ...mapGetters({
      viewType: 'GET_VIEW_TYPE'
    })
  },

  methods: {
    ...mapActions(['TOGGLE_SHOW_USER_PANEL']),

    showUserPanel () {
      this.TOGGLE_SHOW_USER_PANEL(true)
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  width 100%
  -webkit-app-region drag
.avatar
  width 40px
  height 40px
  margin 40px auto 0px
  border-radius 50%
  overflow hidden
  -webkit-app-region drag
  &.expanded
    margin 20px auto 0px
  img
    width 100%
    height 100%
</style>

