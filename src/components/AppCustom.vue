<template>
  <div id="title">
    <div class="btn_list">
      <span class="btn min" @click="handleClick('min')">
        <img src="../assets/images/lanhu/min3@2x.png">
      </span>
      <span class="btn max" @click="handleClick('max')">
        <img :src="reset === true ? unMax:max" id="max_img">
      </span>
      <span class="btn close" @click="handleClick('appQuit')">
        <img src="../assets/images/lanhu/close2@2x.png">
      </span>
    </div>
  </div>
</template>

<script>
  import { ipcRenderer, BrowserWindow, app } from 'electron'
  export default {
    data() {
      return {
        reset: false,
        max: require('../assets/images/lanhu/max2@2x.png'),
        unMax: require('../assets/images/lanhu/unMax2@2x.png')
      }
    },
    methods: {
      handleClick (type) {
        ipcRenderer.send(type)
        let max = document.getElementById('max_img')
        if (type === 'max') {
          if(this.reset) {
            this.reset = false
          } else {
            this.reset = true
          }
        }
      }
    }
  }
</script>

<style lang="stylus" scoped>
#title
  height 30px
  padding 0 15px
  width 100%
  -webkit-app-region drag
  position fixed
  top 0
  .btn_list
    width 120px
    height 100%
    display flex
    // background red
    flex 1
    align-items center
    justify-content space-between
    float right
    .btn
      // width 28px
      height 30px
      display flex
      flex 1
      justify-content center
      align-items center
      &:hover
        background #e6e6e6
      &.close:hover
        background #da512c
        
      img
        width 14px
        height 14px
</style>
