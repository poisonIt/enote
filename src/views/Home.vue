<template>
  <div class="home">
    <div v-if="isDev">
      <!-- <button style="position: fixed;top: 10px;left: 20px;z-index: 9999999;" @click="hideBackground">hideBackground</button>
      <button style="position: fixed;top: 50px;left: 20px;z-index: 9999999;" @click="showBackground">showBackground</button>
      <button style="position: fixed;top: 30px;left: 20px;z-index: 9999999;" @click="deleteAll">deleteAll</button>
      <button style="position: fixed;top: 30px;left: 160px;z-index: 9999999;" @click="goLogin">goLogin!</button> -->
    </div>
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
        <FolderComp style="height: 100%" v-show="currentFile && currentFile.type === 'folder'"></FolderComp>
      </div>
    </PageLayout>
    <MovePanel></MovePanel>
    <UserPanel></UserPanel>
    <SharePanel></SharePanel>
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
import FolderComp from '@/components/FolderComp.vue'
// import ProgressBar from '@/components/ProgressBar'
import MovePanel from '@/components/Panels/MovePanel'
import UserPanel from '@/components/Panels/UserPanel'
import SharePanel from '@/components/Panels/SharePanel'
import ResearchPanel from '@/components/Panels/ResearchPanel'
import SettingPanel from '@/components/Panels/SettingPanel'
import Loading from '@/components/Loading'

import { createCollection } from '../../db'
import LocalDAO from '../../db/api'
import * as LocalService from '../service/local'
import { getLocalUserById } from '@/service/local'
import { getAppConf, saveAppConf } from '@/tools/appConf'

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
    FolderComp,
    // ProgressBar,
    MovePanel,
    UserPanel,
    SharePanel,
    ResearchPanel,
    SettingPanel,
    Loading
  },

  data () {
    return {
      isDev: isDevelopment,
      isSyncPanelShowed: false,
      isFrdPanelShowed: false,
      syncProgress: 0,
      fdSearchKey: '',
      selectedFd: null,
      fdList: [],
      friendChecked: [],
      validity: '000',
      validities: [
        {
          name: '永久有效',
          id: '000',
          children: []
        },
        {
          name: '1天',
          id: '001',
          children: []
        },
        {
          name: '7天',
          id: '002',
          children: []
        }
      ],
      authorities: [
        {
          name: '公开-所有人可查看',
          id: '000',
          children: []
        },
        {
          name: '私密-指定成员可查看',
          id: '001',
          children: []
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      viewFileType: 'GET_VIEW_FILE_TYPE',
      viewType: 'GET_VIEW_TYPE',
      currentFile: 'GET_CURRENT_FILE',
      isUserPanelShowed: 'GET_SHOW_USER_PANEL',
      isSharePanelShowed: 'GET_SHOW_SHARE_PANEL',
      userInfo: 'GET_USER_INFO',
      isHomeReady: 'GET_IS_HOME_READY'
    })
  },

  watch: {
    validity (val) {
      console.log('watch-validity', val)
    },

    fdSearchKey (val) {
      if (val === '') {
        this.fdList = this.userInfo.friend_list
      }

      this.fdList = this.userInfo.friend_list
        .filter(item => item.username.indexOf(val) > -1)
    }
  },

  created () {
    if (!isDevelopment) {
      window.onbeforeunload = (e) => {
        e.returnValue = false
        let curWin = this.$remote.getCurrentWindow()
        let backWin = curWin.getParentWindow()
        curWin.hide()
        backWin.hide()
      }
    }

    ipcRenderer.on('fetch-user-data-response', (event, arg) => {
      console.log('fetch-user-data-response-1111', arg)
      if (arg.from === 'Home') {
        this.SET_USER_INFO(arg.res)
        this.SET_TOKEN(arg.res.id_token)
      }
    })
    this.handleDBLoaded()
  },

  mounted () {
    if (this.userInfo.friend_list && this.userInfo.friend_list.length > 0) {
      this.selectedFd = this.userInfo.friend_list[0]
    }
  },

  methods: {
    ...mapActions([
      'SET_FILES_FROM_LOCAL',
      'SET_USER_INFO',
      'SET_TOKEN',
      'TOGGLE_SHOW_USER_PANEL',
      'TOGGLE_SHOW_SHARE_PANEL',
      'SET_FILE_PUSH_FINISHED',
      'SET_VIEW_TYPE',
      'SET_DB_READY',
      'SET_NOTE_VER'
    ]),

    // closeUserPanel () {
    //   this.TOGGLE_SHOW_USER_PANEL(false)
    // },

    asyncUser () {
      this.isSyncPanelShowed = true

      const itvCb = () => {
        if (this.syncProgress < 100) {
          this.syncProgress++
        } else {
          clearInterval(itvCb)
          setTimeout(() => {
            this.isSyncPanelShowed = false
            this.TOGGLE_SHOW_USER_PANEL(false)
          }, 1000)
        }
      }
      setInterval(itvCb, 30)
    },

    // closeSyncPanel () {
    //   this.isSyncPanelShowed = false
    // },

    closeSharePanel () {
      this.TOGGLE_SHOW_SHARE_PANEL(false)
    },

    showFrdPanel () {
      console.log('showFrdPanel', this.isFrdPanelShowed)
      this.isFrdPanelShowed = true
    },

    closeFrdPanel () {
      this.isFrdPanelShowed = false
    },

    changeViewType () {
      this.SET_VIEW_TYPE(this.viewType === 'unexpanded' ? 'expanded' : 'unexpanded')
    },

    selectFdItem (item) {
      this.selectedFd = item
    },

    handleFriendStateChange () {
      this.friendChecked = this.userInfo.friend_list.filter(item => item.state)
    },

    handleFriendUnChecked (fd) {
      fd.state = false
      this.handleFriendStateChange()
    },

    resetData () {
      // LocalDAO.folder.removeAll()
      LocalDAO.note.removeAll()
      LocalDAO.doc.removeAll()
    },

    removeTags () {
      LocalDAO.tag.removeAll()
    },

    hideBackground () {
      ipcRenderer.send('hideWindow', {
        name: 'background'
      })
    },

    showBackground () {
      ipcRenderer.send('showWindow', {
        name: 'background'
      })
    },

    goLogin () {
      saveAppConf(this.$remote.app.getAppPath('appData'), {
        user: null
      })
      ipcRenderer.send('changeWindow', {
        name: 'login'
      })
    },

    handleDBLoaded () {
      const { user, dbPath } = this.$remote.app.appConf
      // let p = dbPath + '/' + user
      // createCollection('folder', user)
      // createCollection('note', user)
      // createCollection('doc', user)
      // createCollection('tag', user)
      // createCollection('state', user)
      ipcRenderer.send('fetch-user-data', {
        from: 'Home'
      })
      // LocalService.getLocalState().then(res => {
      //   console.log('getLocalState', res)
      //   this.SET_NOTE_VER(res.note_ver)
      // })
      this.SET_DB_READY(true)
    },

    deleteAll () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['deleteAll'],
        from: 'Home',
      })
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
