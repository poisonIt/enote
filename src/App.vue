<template>
  <div id="app">
    <AppHeader></AppHeader>
    <Home></Home>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { mapActions } from 'vuex'
import AppHeader from '@/components/AppHeader'
import Home from '@/views/Home'

export default {
  components: {
    AppHeader,
    Home
  },

  created () {
    fetch('./mock/files.json').then(resp => {
      return resp.json()
    }).then(data => {
      console.log(data)
      if (!data['000000']) {
        let timeStamp = String(dayjs(new Date()).valueOf())
        let id = '000000'
        data[id] = {
          id: id,
          type: 'folder',
          title: '我的文件夹',
          content: '',
          create_at: timeStamp,
          update_at: timeStamp,
          file_size: '0',
          file_path: ['/'],
          ancestor_folders: [],
          child_folders: []
        }
      }
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

    setTimeout(() => {
      this.showMovePanel = true
    }, 3000)
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
</style>
