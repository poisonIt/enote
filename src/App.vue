<template>
  <div id="app">
    <!-- <AppHeader></AppHeader> -->
    <router-view></router-view>
    <!-- <Home></Home> -->
    <!-- <div ref="youdaoEditor"></div> -->
    <!-- <div class="click-mask"></div> -->
    <!-- <button style="position: fixed;top: 30px;left: 20px;" @click="resetData">reset</button> -->
  </div>
</template>

<script>
import { mapActions } from 'vuex'
// import AppHeader from '@/components/AppHeader'
import Home from '@/views/Home'
import { getAllLocalNote, getAllLocalDoc } from '@/service/local'

export default {
  components: {
    // AppHeader,
    Home
  },

  created () {
    getAllLocalNote().then(res => {
      console.log('getAllLocalNote', res)
    })

    getAllLocalDoc().then(res => {
      console.log('getAllLocalDoc', res)
    })
  },


  mounted () {
    window.addEventListener('online', () => {
      console.log('online')
      this.SET_NETWORK_STATUS('online')
    })
    window.addEventListener('offline', () => {
      console.log('offline')
      this.SET_NETWORK_STATUS('offline')
    })

    // document.addEventListener('drop', function (e) {
    //   e.preventDefault()
    //   e.stopPropagation()

    //   for (let f of e.dataTransfer.files) {
    //     console.log('File(s) you dragged here: ', f)
    //   }
    // })
    // document.addEventListener('dragover', function (e) {
    //   e.preventDefault()
    //   e.stopPropagation()
    // })
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
