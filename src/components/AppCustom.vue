<template>
  <div id="title">
    <div class="btn_list">
      <span class="btn min" @click="handleClick('min')">
        <img src="../assets/images/lanhu/min3@2x.png">
      </span>
      <span class="btn max" @click="handleClick('max')">
        <img src="../assets/images/lanhu/max2@2x.png" class="max_img">
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
        reset: false
      }
    },
    methods: {
      handleClick (type) {
        ipcRenderer.send(type)
        let max = document.getElementsByClassName('max_img')
        if (type === 'max') {
          if (max.getAttribute('src') == '../assets/images/lanhu/max2@2x.png') {
            max.setAttribute('src', '../assets/images/lanhu/unMax2@2x.png');
          } else {
              max.setAttribute('src', '../assets/images/lanhu/max2@2x.png');
          }
        }
      }
    }
  }
</script>

<style lang="stylus" scoped>
#title
  height 30px
  padding 0 25px
  width 100%
  -webkit-app-region drag
  position absolute
  top 0
  .btn_list
    width 78px
    height 100%
    display flex
    flex 1
    align-items center
    justify-content space-between
    float right
    .btn
      width 28px
      height 28px
      display flex
      flex 1
      justify-content center
      align-items center
      &:hover
        background #e6e6e6
      img
        width 14px
        height 14px
</style>
