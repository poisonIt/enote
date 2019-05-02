<template>
  <div id="login">
    <div class="logo"></div>
    <p class="title">添富云笔记</p>
    <div class="form">
      <div class="input username">
        <input class="round"
          type="text"
          v-model="username"
          placeholder="用户名">
      </div>
      <div class="input password">
        <input class="round"
          type="password"
          v-model="password"
          placeholder="密码"
          @keyup.enter="postInput">
      </div>
      <div class="button round"
        :class="{ disabled: isLoading }"
        @click="postInput">
        <div class="login-loading" v-if="isLoading">
          <Loading :type="1" fill="#fff" style="transform: scale(.8) translate(-10px, -15px)"></Loading>
        </div>
        <span v-if="!isLoading">登录</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import { createCollection } from '../../db'
import {
  authenticate,
  getUserInfo,
  getFriendList,
  pullNotebooks,
  pullNote,
  pullTags
} from '../service'
import * as LocalService from '../service/local'
import { saveAppConf } from '../tools/appConf'
import { mapActions } from 'vuex'
import pullData from '@/utils/mixins/pullData'
import pushData from '@/utils/mixins/pushData'
import Loading from '@/components/Loading'

export default {
  name: 'Login',

  mixins: [ pullData, pushData ],

  components: {
    Loading
  },

  data () {
    return {
      username: '',
      password: '',
      isLoading: false
    }
  },

  created () {
    const dbPath = remote.app.appConf.dbPath
    createCollection('user', dbPath)

    LocalService.getAllLocalUser().then(res => {
      console.log('getAllLocalUser', res)
    })
  },

  methods: {
    ...mapActions([
      'SET_TOKEN',
      'SET_FILES_FROM_LOCAL'
    ]),

    async postInput () {
      if (this.isLoading) return
      this.isLoading = true
      const { username, password } = this

      let authenticateResp = await authenticate({
        username: username,
        password: password
      }).catch(err => {
        this.isLoading = false
        return
      })
     
      if (authenticateResp.data.returnCode === 200) {
        const id_token = authenticateResp.data.body.id_token
        this.SET_TOKEN(id_token)
        let userResp = await this.pullUserInfo(id_token, username, password)
        if (!userResp.userData) return
        // userResp.userData.is_last_login = true
        let userSaved = await LocalService.updateLocalUser(userResp.userData)
        saveAppConf(this.$remote.app.getAppPath('appData'), {
          user: userSaved._id
        })
        console.log('userSaved', userSaved)
        console.log('userResp', userResp)
        this.connectDB(userSaved._id)
      } else {
        this.isLoading = false
      }
    },

    connectDB (userId) {
      const dbPath = remote.app.appConf.dbPath
      createCollection('folder', dbPath + '/' + userId)
      createCollection('note', dbPath + '/' + userId)
      createCollection('doc', dbPath + '/' + userId)
      this.handleFetch()
    },

    async handleFetch () {
      console.log('handleFetch')
      // let localFolders = await LocalDAO.folder.getAll()
      // console.log('localFolders', localFolders)
      // await this.pushImgs()
      // await this.SET_FILES_FROM_LOCAL()
      // await this.pushData()
      let pullResp = await this.pullData()
      console.log('pullResp', pullResp)
      this.handleDataFinished()
    },

    handleDataFinished () {
      ipcRenderer.send('login-ready')
      ipcRenderer.send('create-home-window')
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

      // const friendResp = await getFriendList(id_token).catch(err => {
      //   this.isLoading = false
      //   return
      // })
      // if (friendResp.data.returnCode !== 200) {
      //   return {
      //     returnMsg: friendResp.data.returnMsg
      //   }
      // }

      const userDataTransed = this.transUserData(userInfoResp.data.body)
      userDataTransed.password = password
      userDataTransed.id_token = id_token
      // userDataTransed.friend_list = friendResp.data.body
      console.log('userDataTransed', userDataTransed)
      return {
        userData: userDataTransed,
        // returnMsg: friendResp.data.returnMsg
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
#login
  position relative
  width 100%
  height 100%
  background #fff
  background-image url('../assets/images/lanhu/login_bg@1x.png')
  background-size contain
  background-repeat no-repeat
  -webkit-app-region drag

.logo
  width 84px
  height 84px
  position absolute
  top 60px
  left 50%
  transform translateX(-50%)
  background-image url('../assets/images/lanhu/logo_white@1x.png')
  background-size contain
  background-repeat no-repeat

.title
  width 100%
  position absolute
  top 145px
  color #fff
  font-size 16px
  font-weight 600
  text-align center

.form
  position absolute
  bottom 113px
  left 50%
  transform translateX(-50%)

.round
  border-radius 18px

.input input, .button
  width 248px
  height 36px
  line-height 36px
  border none

.input
  position relative
  margin-bottom 21px
  &::before
    content ''
    display block
    width 14px
    height 14px
    position absolute
    left 13px
    top 50%
    transform translateY(-50%)
    background-size contain
    background-repeat no-repeat
  &.username::before
    background-image url('../assets/images/lanhu/username@2x.png')
  &.password::before
    background-image url('../assets/images/lanhu/password@2x.png')

input
  position relative
  padding-left 34px
  color #fff
  caret-color #fff
  border-radius inherit
  background-color rgba(0, 0, 0, 0.45)
  outline none
  border 0px solid rgba(0 ,0, 0, 0)
  transition all ease 0.3s
  &:focus
    border 1px solid #DDAF59

.button
  position relative
  background-color #DDAF59
  color #fff
  font-size 14px
  margin-top 38px
  &.disabled
    background-color #a2a2a2

.login-loading
  width 20px
  height 20px
  position absolute
  top 50%
  left 50%
  transform translate(-50%, -50%)
</style>
