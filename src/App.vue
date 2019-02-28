<template>
  <div id="app">
    <AppHeader></AppHeader>
    <Home></Home>
    <!-- <div class="click-mask"></div> -->
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import AppHeader from '@/components/AppHeader'
import Home from '@/views/Home'

export default {
  components: {
    AppHeader,
    Home
  },

  created () {
    this.SET_FILES_FROM_LOCAL()
  },

  mounted () {
    document.addEventListener('drop', function (e) {
      e.preventDefault()
      e.stopPropagation()

      for (let f of e.dataTransfer.files) {
        console.log('File(s) you dragged here: ', f)
      }
    })
    document.addEventListener('dragover', function (e) {
      e.preventDefault()
      e.stopPropagation()
    })

    setTimeout(() => {
      this.showMovePanel = true
    }, 3000)
  },

  methods: {
    ...mapActions([
      'SET_FILES_FROM_LOCAL',
      'SET_FILES',
      'SET_ALL_DOC_CONTENT'
    ])
  }
}
</script>

<style lang="stylus">
*
  padding 0
  margin 0
  box-sizing border-box
  user-select none

html, body
  width 100%
  height 100%
  display flex

ul, li
  list-style-type none

#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
  width 100%
  height 100%
  padding-top 40px
  // display flex
  // flex-direction row
  overflow hidden

.ellipsis
  width 100%
  overflow hidden
  white-space nowrap
  text-overflow ellipsis

.button-group
  width 80%
  position absolute
  bottom 30px
  left 50%
  transform translateX(-50%)
  display flex
  flex-direction row
  align-items center
  justify-content space-around
  margin-top 30px
.button
  width 80px
  height 32px
  border-radius 4px
  background-color #fff
  text-align center
  line-height 32px
  border 1px solid #c3c1c1
  &.primary
    border none
    background-color #198cf0
    color #fff

.click-mask
  position fixed
  top 0
  bottom 0
  left 0
  right 0
  width 100%
  height 100%
  background-color transparent
</style>
