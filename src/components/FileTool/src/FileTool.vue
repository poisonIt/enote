<template>
  <div class="container" :class="{ 'is-expanded' : viewType === 'expanded' }">
    <div class="expanded" v-if="viewType === 'expanded'">
      <div class="item new" @click="toggleMenu">
        <div class="icon-new"></div>
        <span>新建</span>
      </div>
      <div class="item sync" :class="{ grey: isOffline }" @click="pushLocalData(30)">
        <div class="icon-sync infinite rotate" :class="{ animated: isSyncing }"></div>
        <span>同步</span>
      </div>
    </div>
    <div class="button-sync infinite rotate" :class="{ grey: isOffline, animated: isSyncing }" v-if="viewType === 'unexpanded'" @click="pushLocalData(30)"></div>
    <div class="unexpanded" v-if="viewType === 'unexpanded'" @click="toggleMenu">+</div>
    <Menu
      :class="{ 'menu': true, 'is-expanded': viewType === 'expanded' }"
      :data="menuData"
      :visible="isMenuVisible"
      @close="closeMenu"
      @itemClick="handleMenuClick">
    </Menu>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'
import {
  authenticate,
  getUserInfo,
  getFriendList
} from '../../../service'
import fetchLocal from '../../../utils/fetchLocal'

export default {
  name: 'FileTool',

  mixins: mixins,

  data () {
    return {
      asyncItv: null,
      isOffline: false,
      isMenuVisible: false,
      menuData: [
        {
          label: '新建笔记',
          value: 'new_note'
        },
        {
          label: '新建文件夹',
          value: 'new_folder'
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      isUserReady: 'GET_USER_READY',
      noteVer: 'GET_NOTE_VER',
      userInfo: 'GET_USER_INFO',
      viewType: 'GET_VIEW_TYPE',
      isEditorFocused: 'GET_IS_EDITOR_FOCUSED',
      network_status: 'GET_NETWORK_STATUS'
    })
  },

  watch: {
    isUserReady (val) {
      if (val) {
        this.syncData()
      }
    },

    network_status (val, oldVal) {
      this.isOffline = (val === 'offline')
      if (val === 'online' && oldVal === 'offline') {
        this.pushData()
      }
      return // 密码错误3次账号会被锁住
      if (!this.isOffline && this.$remote.getCurrentWindow().isVisible()) {
        setTimeout(() => {
          this.authenticate()
        }, 3000)
      }
    }
  },

  created () {
    this.isOffline = !window.navigator.onLine
  },

  mounted () {
    ipcRenderer.on('communicate', (event, arg) => {
      if (arg.from === 'Preview' && arg.tasks.indexOf('pushData') > -1) {
        this.pushLocalData()
      }
    })
    if (this.isOffline) {
      this.clearSyncItv()
    }
  },

  methods: {
    ...mapActions([
      'SET_TOKEN',
      'SET_DB_READY'
    ]),

    toggleMenu () {
      this.isMenuVisible = !this.isMenuVisible
    },

    closeMenu () {
      this.isMenuVisible = false
    },

    newNote () {
      this.$hub.dispatchHub('newNote', this)
      // this.$hub.dispatchHub('newTemplateNote', this)
    },

    newFolder () {
      this.$hub.dispatchHub('newFolder', this)
    },

    handleMenuClick (value) {
      if (value === 'new_note') {
        this.newNote()
      } else if (value === 'new_folder') {
        this.newFolder()
      }
    },

    createSyncItv () {
      this.asyncItv = setInterval(() => {
        this.checkIsEditorFocused()
        if(this.isEditorFocused || this.isSyncing) return
        this.pushLocalData()
      }, 5000)
    },

    clearSyncItv () {
      clearInterval(this.asyncItv)
    },

    async syncData () {
      if (!this.isOffline) {
        await this.pullData(this.noteVer)
        this.SET_DB_READY(true)
        setTimeout(() => {
          this.pushData()
        }, 1000)
      } else {
        this.SET_DB_READY(true)
      }
    },

    pushLocalData (delay, isAuto) {
      if (!window.navigator.onLine) return
      if (!delay) {
        delay = 1000
      }
      // if (isAuto) return
      setTimeout(() => {
        this.pushData()
      }, delay)
    },

    checkIsEditorFocused () {
      this.$hub.dispatchHub('getIsFocused', this)
    },

    async authenticate () {
      const username = this.userInfo.local_name
      const password = this.userInfo.password

      let authenticateResp = await authenticate({
        username: username,
        password: password
      }).catch(err => {
        console.error(err)
        // this.$Message.error('认证错误，请重新登录')
        setTimeout(() => {
          this.authenticate()
        }, 6000)
      })

      if (authenticateResp.data.returnCode === 200) {
        const id_token = authenticateResp.data.body.id_token
        this.SET_TOKEN(id_token)
        let userResp = await this.pullUserInfo(id_token, username, password)
        if (!userResp.userData) return
        fetchLocal('updateLocalUser', userResp.userData)
      } else {
        this.$Message.error(authenticateResp.data.returnMsg)
      }
    },

    async pullUserInfo (id_token, username, password) {
      const userInfoResp = await getUserInfo(id_token).catch(err => {
        this.isLoading = false
        return
      })
      if (userInfoResp.data.returnCode !== 200) {
        return {
          returnMsg: userInfoResp.data.returnMsg
        }
      }

      const friendResp = await getFriendList(id_token).catch(err => {
        this.isLoading = false
        return
      })
      if (friendResp.data.returnCode !== 200) {
        return {
          returnMsg: friendResp.data.returnMsg
        }
      }

      const userDataTransed = this.transUserData(userInfoResp.data.body)
      userDataTransed.local_name = username
      userDataTransed.password = password
      userDataTransed.id_token = id_token
      userDataTransed.friend_list = friendResp.data.body
      return {
        userData: userDataTransed,
        returnMsg: friendResp.data.returnMsg
      }
    },

    transUserData (obj) {
      return {
        username: obj.userName,
        usercode: obj.userCode,
        access_token: obj.accessToken,
        account_name_cn: obj.accountNameCN,
        department_id: obj.departmentId,
        department_name: obj.departmentName,
        image_url: obj.imageUrl,
        is_sync: obj.isSync,
        oa_id: obj.oaId,
        position_id: obj.positionId,
        position_name: obj.positionName
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.grey
  filter grayscale(100%)

.container
  position relative
  width 100%
  height 120px
  display flex
  flex-direction column
  justify-content space-evenly
  align-items center
  &.is-expanded
    height 60px
    display block
  &::after
    content ''
    display block
    width 100%
    height 1px
    background-color #000
    position absolute
    bottom 0
    left 50%
    transform translateX(-50%) scaleY(.3)

.expanded
  width 100%
  height 100%
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  padding 0 10px

.item
  width 135px
  height 36px
  display flex
  flex-direction row
  justify-content space-evenly
  align-items center
  padding 10px
  border-radius 3px
  font-size 14px
  color #C2C2C2

.new
  &::after
    content ''
    width 0
    height 0
    margin-left 10px
    border-top 3px solid transparent
    border-left 4px solid #C2C2C2
    border-bottom 3px solid transparent
    transform rotate(90deg)

.icon-new, .icon-sync
  width 20px
  height 20px
  display block
  font-size 20px
  font-weight 600
  margin-right 10px
  background-repeat no-repeat
  background-size contain
  background-position center

.icon-new
  background-image url(../../../assets/images/lanhu/new@2x.png)
.icon-sync
  background-image url(../../../assets/images/lanhu/sync@2x.png)

.expand
  position relative
  width 36px
  height 36px
  border-radius 3px
  background-color #3161A3
  color #fff
  &::before
    position absolute
    top 50%
    left 60%
    content '>'
    display block
    font-size 14px
    font-weight 500
    transform scaleX(1.8) translate(-50%, -50%) rotate(90deg)

.button-sync,.unexpanded
  width 26px
  height 26px

.button-sync
  background-image url(../../../assets/images/lanhu/sync@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center

.unexpanded
  // position absolute
  // top 50%
  // left 50%
  // transform translate(-50%, -50%)
  border-radius 50%
  font-size 20px
  color #fff
  text-align center
  line-height 28px
  background-color #DDAF59

.menu
  position absolute !important
  top 110px !important
  left 20px
  &.is-expanded
    top 50px !important
</style>
