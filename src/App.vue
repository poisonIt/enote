<template>
  <div id="app">
    <div id="nav">
      <FileTool></FileTool>
      <NavBar></NavBar>
    </div>
    <Home></Home>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import Home from './views/Home'
import FileTool from './components/FileTool'
import NavBar from './components/NavBar/index.js'

export default {
  components: {
    Home,
    FileTool,
    NavBar
  },

  created () {
    fetch('./mock/files.json').then(resp => {
      return resp.json()
    }).then(data => {
      console.log(data)
      this.SET_FILES(data)
    })
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
  },

  methods: {
    ...mapActions(['SET_FILES'])
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
  display flex
  flex-direction row
  overflow hidden

#nav
  min-width 220px
  // border-right 1px solid #e6e6e6
  a
    font-weight bold
    color #2c3e50
    &.router-link-exact-active
      color #42b983

#views
  // flex 1

.ellipsis
  width 100%
  overflow hidden
  white-space nowrap
  text-overflow ellipsis
</style>
