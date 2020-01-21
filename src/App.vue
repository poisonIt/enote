<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
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
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  // -webkit-app-region drag
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
  width 100%
  height 100%
  // padding-top 40px
  // display flex
  // flex-direction row
  overflow hidden
</style>
