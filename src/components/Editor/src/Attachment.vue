<template>
  <div class="attachment">
    <div class="attachment_title">
      <div class="left_dig">
        <img src="../../../assets/images/attachment/attachment.png">
        <span class="description">共 {{ note_files.length }} 个附件，展开可查看下载。</span>
      </div>

      <div class="all_down" @click="handleDownAllAttach">
        <img src="../../../assets/images/attachment/down_load.png">
        全部下载
      </div>
      <span class="attachment_show">
        <img
          src="../../../assets/images/attachment/down_drop.png"
          class="showAll"
          @click="attShow"
          :style="{transform:'rotateZ('+deg+'deg)', transition: 'all 250ms'}"
        >
      </span>

    </div>

    <collapse>
      <div class="attachment_list" v-show="attachShowStatus">
        <ul>
          <li
            v-for="(item, index) of note_files"
            :key="index"
            @mouseover="currentIndex = index"
            @mouseout="currentIndex = -1"
            @click="handleDownFile(item.url)">
            <div class="file_mold">
              <img :src="item.fileType==='EXCEL'?Excel:item.fileType==='PDF'?Pdf:item.fileType==='WORD'?Word:item.fileType==='PPT'?Ppt:Other">
            </div>

            <div class="attach_name">
              <p class="name" :style="{color: currentIndex === index ? '#DDAF59':''}">{{ item.fileName }}</p>
              <div class="down_info">
                <img :src="currentIndex === index ? selSrc: noSelSrc" class="down_img">
                <span class="size">{{ Number(item.size) | size }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </collapse>

  </div>
</template>

<script>
  import collapse from "../../../utils/transitions/collapse.js"
  import { ipcRenderer } from 'electron'
  export default {
    name: 'Attachment',

    props: {
      note_files: {
        type: Array,
        default: []
      },
      attachShow: {
        type: Boolean,
        default: false
      }
    },

    components: { collapse },

    data () {
      return {
        downStatus: '',
        attachShowStatus: this.attachShow,
        deg: 0,
        downUrlList: [],
        currentIndex: -1,
        noSelSrc: require('../../../assets/images/attachment/down_load.png'),
        selSrc: require('../../../assets/images/attachment/down_active.png'),
        Excel: require('../../../assets/images/attachment/excel.png'),
        Pdf: require('../../../assets/images/attachment/pdf.png'),
        Ppt: require('../../../assets/images/attachment/ppt.png'),
        Word: require('../../../assets/images/attachment/word.png'),
        Other: require('../../../assets/images/attachment/other.png')
      }
    },

    filters: {
      size (val) {
        val = val + ''
        if (val.length <= 3) {
          return val + ' B'
        } else if (val.length <= 6) {
          return (parseInt(val) / 1000).toFixed(2) + ' KB'
        } else if (val.length <= 9) {
          return (parseInt(val) / 1000000).toFixed(2) + ' MB'
        } else if (val.length <= 12) {
          return (parseInt(val) / 1000000000).toFixed(2) + ' GB'
        }
      }
    },

    created () {
      //监听main process里发出的message
      ipcRenderer.on('downstate', (event, arg) => {
        console.log(event, arg)
        // alert("下载状态：" + arg);
        this.downStatus = arg
        if (this.downStatus ===  'completed') {
          console.log('下载成功---->', this.fileSavePath)
        }
      })

      ipcRenderer.on('down-done', (event, arg) => {
        // console.log(event, arg)
        // console.log((arg.receive/arg.total*100).toFixed(2)+"%")
        this.fileSavePath = arg.savePath
      })

    },
    methods: {

      attShow () {
        this.attachShowStatus = !this.attachShowStatus
        this.deg += 180;
        if(this.deg >= 360){
            this.deg = 0
        }
      },

      handleDownAllAttach () {
        this.downUrlList = []
        console.log(this.note_files)
        this.note_files.forEach(item => {
          this.downUrlList.push(item.url)
        })
        console.log(this.downUrlList)

        this.downUrlList.forEach(item => {
          ipcRenderer.send('download',item+'+all')
        })

        // if ()
      },

      handleDownFile (url) {
        let downUrl = url;//需要下载文件的路径
        // let savePath = 'file://'

        ipcRenderer.send('download',downUrl)
      }
    },
  }
</script>

<style lang="stylus" scoped>
.attachment
  width 100%
  position absolute
  bottom 0
  border-top 1px solid #E9E9E9
  background #fff
  .attachment_title
    line-height 30px
    height 30px
    // position absolut
    .left_dig
      position absolute
      left 20px
      width 80%
      img
        width 18px
        height 18px
        margin-top 3px
        vertical-align middle
      .description
        font-size 12px
        font-family PingFangSC
        font-weight 400
        color rgba(51,51,51,1)
    .all_down
      position absolute
      background red
      width 83px
      height 24px
      background rgba(255,255,255,1)
      border-radius 4px
      border 1px solid rgba(233,233,233,1)
      display inline-block
      right 44px
      font-size 12px
      font-family PingFangTC
      font-weight 400
      color rgba(51,51,51,1)
      line-height 24px
      top 3px
      cursor pointer
      // bottom 0
      // margin auto
      text-align center
      &:hover
        color #DDAF59
      img
        width 15px
        height 15px
        vertical-align middle
    .attachment_show
      width 20px
      height 30px
      display inline-block
      // background red
      position absolute
      top 0px
      right 14px
      text-align center
      .showAll
        display inline-block
        height 10px
        width 10px
        // left 0
        // bottom 0
  .attachment_list
    height 226px
    width 100%
    border-top 1px solid #E9E9E9
    overflow-y auto
    // transition all 0.5 ease
    ul
      display flex
      flex-wrap wrap
      justify-content space-between
      padding 15px 15px
      &:after
        content:' ';
        flex:auto;
      li
        margin-bottom 20px
        width 24%
        height 34px
        cursor pointer
        margin-right 1%;
        width  -webkit-calc((100% - 1%*4) / 4);
        width  calc((100% - 1%*4) / 4)
        position relative
        .file_mold
          width 34px
          position absolute
          left 0
          // background #678
          margin-right 10px
          img
            width 100%
            // height 34px
            vertical-align middle

        .attach_name
          // position absolute
          margin-left 40px
          // width 70%
          // background blue
          line-height 15px
          .name
            // background #fff
            display inline-block
            width 100%
            font-size 12px
            font-family PingFangTC
            font-weight 400
            color rgba(51,51,51,1)
            overflow hidden
            text-overflow ellipsis
            white-space nowrap
            line-height 15px

          .down_info
            // height 17px
            // background  yellow
            // margin 0
            .down_img
              width 11px
              height 11px
              vertical-align text-top
              margin-right 6px
              // margin-top 3px
            .size
              // width 55px
              // line-height 20px
              overflow hidden
              text-overflow ellipsis
              white-space nowrap
              font-size 12px
              font-family PingFangTC
              font-weight 400
              color rgba(153,153,153,1)
</style>
