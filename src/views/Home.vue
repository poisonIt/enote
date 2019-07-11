<template>
  <div class="home">
    <PageLayout>
      <div slot="left">
        <div id="nav">
          <User></User>
          <FileTool></FileTool>
          <NavBar ref="navbar"></NavBar>
          <div v-if="viewType === 'unexpanded'" class="expand-button" :class="{ unexpanded : viewType === 'unexpanded' }" @click="changeViewType"></div>
        </div>
      </div>
      <div slot="middle">
        <div v-if="viewType === 'expanded'" class="expand-switch" :class="{ unexpanded : viewType === 'unexpanded' }" @click="changeViewType"></div>
        <DocumentList></DocumentList>
      </div>
      <div slot="right">
        <FileHandler></FileHandler>
        <TagHandler></TagHandler>
        <Editor style="height: 100%"></Editor>
        <!-- <Content style="height: 100%"></Content> -->
        <FolderComp style="height: 100%" v-show="currentFile && currentFile.type === 'folder'"></FolderComp>
      </div>
    </PageLayout>
    <MovePanel></MovePanel>
    <UserPanel></UserPanel>
    <SharePanel></SharePanel>
    <HistoryPanel></HistoryPanel>
    <ResearchPanel></ResearchPanel>
    <SettingPanel></SettingPanel>
    <div class="home-loading" v-if="!isHomeReady">
      <Loading :type="1" fill="#DDAF59" style="transform: scale(1.2)"></Loading>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapActions, mapGetters } from 'vuex'

import User from '@/components/User'
import NavBar from '@/components/NavBar'
import FileTool from '../components/FileTool'
import PageLayout from '@/components/PageLayout.vue'
import DocumentList from '@/components/DocumentList'
import FileHandler from '@/components/FileHandler'
import TagHandler from '@/components/TagHandler.vue'
import Editor from '@/components/Editor'
import Content from '@/components/Editor/src/Content'
import FolderComp from '@/components/FolderComp.vue'
// import ProgressBar from '@/components/ProgressBar'
import MovePanel from '@/components/Panels/MovePanel'
import UserPanel from '@/components/Panels/UserPanel'
import SharePanel from '@/components/Panels/SharePanel'
import HistoryPanel from '@/components/Panels/HistoryPanel'
import ResearchPanel from '@/components/Panels/ResearchPanel'
import SettingPanel from '@/components/Panels/SettingPanel'
import Loading from '@/components/Loading'

import { createCollection } from '../../db'
import LocalDAO from '../../db/api'
import { validateToken } from '../service'
import { getAppConf, saveAppConf } from '@/tools/appConf'
import fetchLocal from '../utils/fetchLocal'

const isDevelopment = process.env.NODE_ENV !== 'production'

export default {
  name: 'home',

  components: {
    User,
    NavBar,
    FileTool,
    PageLayout,
    DocumentList,
    FileHandler,
    TagHandler,
    Editor,
    Content,
    FolderComp,
    // ProgressBar,
    MovePanel,
    UserPanel,
    SharePanel,
    HistoryPanel,
    ResearchPanel,
    SettingPanel,
    Loading
  },

  data () {
    return {
      validateTokenItv: null
    }
  },

  computed: {
    ...mapGetters({
      viewFileType: 'GET_VIEW_FILE_TYPE',
      viewType: 'GET_VIEW_TYPE',
      currentFile: 'GET_CURRENT_FILE',
      isHomeReady: 'GET_IS_HOME_READY',
      network_status: 'GET_NETWORK_STATUS'
    })
  },

  watch: {
    network_status (val) {
      if (val === 'online') {
        this.createValidateTokenItv()
      } else {
        this.clearValidateTokenItv()
      }
    }
  },

  created () {
    window.onbeforeunload = (e) => {
      e.returnValue = false
      let curWin = this.$remote.getCurrentWindow()
      curWin.hide()
    }

    ipcRenderer.on('login-ready', (event, arg) => {
      ipcRenderer.send('fetch-user-data', {
        from: 'Home'
      })
    })

    ipcRenderer.on('fetch-user-data-response', (event, arg) => {
      if (arg.from === 'Home') {
        this.SET_USER_INFO(arg.res)
        this.SET_TOKEN(arg.res.id_token)
        this.SET_NOTE_VER(this.$remote.app.appConf.note_ver || 0)
        this.SET_USER_READY(true)
        if (window.navigator.onLine) {
          this.createValidateTokenItv()
        }
      }
    })
  },

  methods: {
    ...mapActions([
      'SET_USER_INFO',
      'SET_TOKEN',
      'SET_VIEW_TYPE',
      'SET_USER_READY',
      'SET_NOTE_VER',
      'SET_NETWORK_STATUS'
    ]),

    changeViewType () {
      this.SET_VIEW_TYPE(this.viewType === 'unexpanded' ? 'expanded' : 'unexpanded')
    },

    createValidateTokenItv () {
      if (this.validateTokenItv) {
        return
      }

      this.validateTokenItv = setInterval(() => {
        validateToken().then(res => {
          if (this.network_status === 'offline') {
            this.SET_NETWORK_STATUS('online')
          }

          if (res.data.returnCode !== 200) {
            this.$Message.warning('登录状态已改变，请重新登录')
            this.clearValidateTokenItv()
            setTimeout(() => {
              ipcRenderer.send('logout')
            }, 3000)
          }
        }).catch(err => {
          this.SET_NETWORK_STATUS('offline')
          this.createValidateTokenItv()
        })
      }, 10000)
    },

    clearValidateTokenItv () {
      clearInterval(this.validateTokenItv)
      this.validateTokenItv = null
    }
  }
}
</script>

<style lang="stylus" scoped>
.home
  // flex 1
  height 100%
  display flex
  flex-direction column

#nav
  position relative
  width 100%
  height 100%
  display flex
  flex-direction column
  // border-right 1px solid #e6e6e6
  a
    font-weight bold
    color #2c3e50
    &.router-link-exact-active
      color #42b983

.user-info
  font-size 12px
  line-height 48px
  color #333
  font-weight 600
  .item
    span:nth-of-type(1)
      display inline-block
      width 80px
      color #999999
      text-align right
      margin-right 20px

.expand-button
  width 70px
  height 60px !important
  position absolute !important
  left 0
  bottom 0
  background-image url('../assets/images/lanhu/view_expand@2x.png')
  background-size 40%
  background-position center
  background-repeat no-repeat

.expand-switch
  width 17px
  height 31px !important
  position absolute !important
  left -1px
  bottom 0
  border-radius 0 4px 4px 0
  background-color #3C3E44
  z-index 1
  &::after
    position absolute
    left 50%
    top 50%
    transform translate(-50%, -50%) rotate(180deg)
    content ''
    display block
    width 0
    height 0
    border-top 3px solid transparent
    border-left 4px solid #C2C2C2
    border-bottom 3px solid transparent
  &.unexpanded
    &::after
      transform translate(-50%, -50%) rotate(0)

.home-loading
  position fixed
  width 100%
  height 100%
  display flex
  align-items center
  justify-content center
  background-color #fcfbf7
  z-index 9999999
</style>
