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
          @keyup.enter="postData">
      </div>
      <div class="button round"
        :class="{ disabled: isLoading }"
        @click="postData">
        登录
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { 
  authenticate,
  getUserInfo,
  getFriendList,
  pullNotebooks,
  pullNote,
  pullTags
} from '../service'
import LocalDAO from '../../db/api'
import { saveAppConf } from '../tools/appConf'
import { mapActions } from 'vuex'
import pullData from '@/utils/mixins/pullData'
import pushData from '@/utils/mixins/pushData'

export default {
  name: 'Login',

  mixins: [ pullData, pushData ],

  data () {
    return {
      username: '',
      password: '',
      isLoading: false
    }
  },

  created () {
    LocalDAO.user.getAll().then(res => {
      console.log('user-resp', res)
    })

    ipcRenderer.on('db-loaded', (event, arg) => {
      this.handleDBLoaded()
    })
  },

  methods: {
    ...mapActions([
      'SET_TOKEN',
      'SET_FILES_FROM_LOCAL'
    ]),

    async postData () {
      // this.goHome()
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
        userResp.userData.is_last_login = true
        let userSaved = await LocalDAO.user.update(userResp.userData)
        saveAppConf(this.$remote.app.getAppPath('appData'), {
          user: userSaved._id
        })  
        console.log('userSaved', userSaved)
        ipcRenderer.send('loadDB', {
          path: `../database/${userSaved._id}`
        })
        console.log('userResp', userResp)
      } else {
        this.isLoading = false
      }
    },

    async handleDBLoaded () {
      console.log('handleDBLoaded')
      let localFolders = await LocalDAO.folder.getAll()
      console.log('localFolders', localFolders)
      // await this.pushImgs()
      // await this.SET_FILES_FROM_LOCAL()
      // await this.pushData()
      // let pullResp = await this.pullData()
      // console.log('pullResp', pullResp)
      this.handleDataFinished()
    },

    handleDataFinished () {
      this.goHome()
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

    goHome () {
      ipcRenderer.send('changeWindow', {
        name: 'home'
      })
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
  background-color #DDAF59
  color #fff
  font-size 14px
  margin-top 38px
  &.disabled
    background-color #a2a2a2
</style>
