<template>
  <div id="app" :style="appStyle">
    <router-view></router-view>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  computed: {
    appStyle () {
      let result = {}
      if (this.$remote.app.appConf.platform !== 'darwin') {
        result.border = '1px solid #f3f3f3'
      }
      return result
    }
  },

  mounted () {
    let network_status = window.navigator.onLine ? 'online' : 'offline'
    this.SET_NETWORK_STATUS(network_status)
    window.addEventListener('online', () => {
      console.log('online')
      this.SET_NETWORK_STATUS('online')
    })
    window.addEventListener('offline', () => {
      console.log('offline')
      this.SET_NETWORK_STATUS('offline')
    })
  },

  methods: {
    ...mapActions([
      'SET_NETWORK_STATUS'
    ])
  }
}
</script>

<style lang="stylus">
::-webkit-scrollbar
  display none

*
  -webkit-app-region no-drag

#app
  font-family 'Avenir', Helvetica, Arial, sans-serif,  Microsoft YaHei
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
  width 100%
  height 100%
  // padding-top 40px
  // display flex
  // flex-direction row
  overflow hidden
  &::-webkit-scrollbar
    display none
#history.content
  img
    width 90% !important
</style>
