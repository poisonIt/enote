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
            @click="handleDownFile(item.url, item.fileName, index)">
            <div class="file_mold">
              <img :src="item.fileType==='EXCEL'?Excel:item.fileType==='PDF'?Pdf:item.fileType==='WORD'?Word:item.fileType==='PPT'?Ppt:Other">
              <van-circle
                v-show="hiddenIndex === index || hidden"
                :rate="rate"
                v-model="currentRate"
                :speed="100"
                :stroke-width="80"
                size="34px"
                :text="text"
                :fill="'#678'"
              />
            </div>

            <div class="attach_name">
              <p class="name"
                 :style="{color: currentIndex === index ? '#DDAF59':''}">{{ item.oldName }}</p>
              <div class="down_info">
                <img :src="currentIndex === index ? selSrc: noSelSrc" class="down_img">
                <span class="size">{{ Number(item.size) | size }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </collapse>
    <div class="down_path"
      v-if="downStatus === 'completed'"
    >已保存，文件存储路径为：{{fileSavePath}}</div>
  </div>
</template>

<script>
  import collapse from "../../../utils/transitions/collapse.js"
  import { ipcRenderer, shell } from 'electron'
  /** * 是否为mac系统（包含iphone手机） * */
  const isMac = function() {
  return /macintosh|mac os x/i.test(navigator.userAgent);
  }();


  /** * 是否为windows系统 * */
  const isWindows = function() {
      return /windows|win32/i.test(navigator.userAgent);
  }();
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
        hiddenIndex: -1,
        rate: -1,
        hidden: false,
        fill_color: '#678',
        color: 'DDAF59',
        currentRate: 0,
        downStatus: '',
        fileSavePath: '',
        pathUrl: '',
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

    computed: {
      text() {
        return this.currentRate.toFixed(0) + '%'
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
        // console.log(event, arg)
        // alert("下载状态：" + arg);
        this.downStatus = arg
        if (this.downStatus ===  'completed') {
          // console.log('下载成功---->', this.fileSavePath)
          setTimeout(() => {
            this.downStatus = ''
          }, 5000);
        }
      })

      ipcRenderer.on('down-done', (event, arg) => {
        // console.log(event, arg)
        // console.log((arg.receive/arg.total*100))
        this.rate = (arg.receive/arg.total*100)
        if (this.rate === 100) {
          this.hiddenIndex = -1
          this.hidden = false
        }
        if (isMac) {
          this.pathUrl = arg.savePath
          let pathArr = arg.savePath.split('/')
          pathArr.pop()
          this.fileSavePath = pathArr.join('/')
        } else if (isWindows) {
          this.pathUrl = arg.savePath

          let pathArr = arg.savePath.replace(/\\/g, '\\').split('\\')
          // arg.savePat?h
          pathArr.pop()
          this.fileSavePath = pathArr.join('\\')
          // console.log(this.fileSavePath )

        }
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
        // if (this.fileSavePath) {
        //   shell.showItemInFolder(this.fileSavePath)
        //   return
        // }
        this.downUrlList = []
        for (let i = 0; i < this.note_files.length; i ++) {
          this.downUrlList.push({ url: this.note_files[i].url, index: i })
        }

        this.downUrlList.forEach(item => {
          this.hidden = true
          ipcRenderer.send('download',item.url+'+all')
        })
      },

      handleDownFile (url, file_name, index) {


        if (isWindows) {
          console.log(this.pathUrl, file_name)
          let name = this.pathUrl.replace(/\\/g, '\\').split('\\')
          console.log(name)
          if (name[name.length - 1] === file_name) {
            shell.showItemInFolder(this.pathUrl)
            return
          }
        } else {
          let name = this.pathUrl.split('/')
          if (name[name.length - 1] === file_name) {
            shell.showItemInFolder(this.pathUrl)
            return
          }
        }


        this.hiddenIndex = index
        let downUrl = url;//需要下载文件的路径

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
.down_path
  width:382px;
  height:36px;
  background:rgba(0,0,0,1);
  border-radius:4px;
  opacity:0.6;
  font-size:12px;
  font-family:PingFangSC;
  font-weight:400;
  color:rgba(255,255,255,1);
  line-height:36px;
  text-align center
  position absolute
  z-index 9999
  bottom 270px
  left 0
  right 0
  margin auto
</style>
<style lang="stylus">
.van-circle
  width 34px !important
  height 34px !important
  position absolute
  top 0
  left 0
  color #fff
.van-circle__text
  width 30px !important
  height 30px !important
  position absolute
  background rgba(255, 255, 255, .7)
  border-radius 50%
  // line-height 34px
  text-align center
  line-height: 30px;
  text-align: center;
  top: 0;
  left 0
  right 0
  bottom: 0;
  margin: auto;

</style>
