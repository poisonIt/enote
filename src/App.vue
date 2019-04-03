<template>
  <div id="app">
    <AppHeader></AppHeader>
    <Home></Home>
    <div ref="youdaoEditor"></div>
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

  data () {
    return {
      content: `<?xml version="1.0"?>
<note xmlns="http://note.youdao.com" schema-version="1.0.3" file-version="0"><head xmlns=""/><body xmlns=""><para><coId>5356-1552362458797</coId><text>测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试</text><inline-styles/><styles/></para><para><coId>3300-1552362473769</coId><text></text><inline-styles/><styles/></para><para><coId>2872-1552362471335</coId><text>测试测试测试测试测试测试</text><inline-styles/><styles/></para></body></note>`
    }
  },

  created () {
    this.SET_FILES_FROM_LOCAL()
  },

  mounted () {
    (authBulbEditor({
      url: 'http://updateinfo.youdao.com/editorapi',
      pkn: 'com.youdao.com',
      appKey: '656d2fdc0a922cc6',
      version: 'v1',
      sdkVersion: 'v1',
      appSecret: 'fPduC1Gw2UnS7zqs9k9fsKcVxcuoiUmI',
    })).then((BulbEditor) => {
      this.youdaoEditor = new BulbEditor({
        el: this.$refs.youdaoEditor
      })

      this.youdaoEditor.setContent(this.content, {
        async: true,
      }).then(() => {
        console.log('done')
      })

      this.youdaoEditor.getContent({
        type: 'html',
        async: true
      }).then(html => {
        console.log('youdao', html)
      })
    })

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
