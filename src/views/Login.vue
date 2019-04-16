<template>
  <div id="login">
    <div class="logo"></div>
    <p class="title">添富云笔记</p>
    <div class="form">
      <div class="input username">
        <input class="round" type="text" v-model="username" placeholder="用户名">
      </div>
      <div class="input password">
        <input class="round" type="password" v-model="password" placeholder="密码">
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
  pullNotebooks,
  pullNote
} from '../service'
import LocalDAO from '../../db/api'

export default {
  name: 'Login',

  data () {
    return {
      username: '',
      password: '',
      isLoading: false
    }
  },

  methods: {
    postData () {
      if (this.isLoading) return
      this.isLoading = true
      authenticate({
        username: this.username,
        password: this.password
      }).then(resp => {
        console.log('authenticate', resp)
        if (resp.data.returnCode === 200) {
          const id_token = resp.data.body.id_token
          getUserInfo(id_token).then(userResp => {
            console.log('user-resp', userResp)
            if (userResp.data.returnCode === 200) {
              let userData = userResp.data.body
              let userDataTransed = {
                username: userData.userName,
                password: this.password,
                access_token: userData.accessToken,
                account_name_cn: userData.accountNameCN,
                department_id: userData.departmentId,
                department_name: userData.departmentName,
                image_url: userData.imageUrl,
                is_sync: userData.isSync,
                oa_id: userData.oaId,
                position_id: userData.positionId,
                position_name: userData.positionName
              }
  
              LocalDAO.user.update(userDataTransed).then(res => {
                this.isLoading = true
              })
            } else {
              alert(userResp.data.returnMsg)
            }
          })
          Promise.all([pullNotebooks(id_token), pullNote(id_token)]).then(pullResp => {
            LocalDAO.files.removeAll().then(() => {
              let pullNoteBooksTask = pullResp[0].data.body
                .map(item => LocalDAO.files.add(this.transNoteBookData(item)))

              let pullNoteTask = pullResp[1].data.body
                .map(item => LocalDAO.files.add(this.transNoteData(item)))

              Promise.all([...pullNoteBooksTask, ...pullNoteTask])
                .then(saveLocalRes => {
                  console.log('saveLocalRes', saveLocalRes)
                  this.goHome()
                })
            })
          })
        } else {
          alert('wrong!')
          this.isLoading = false
        }
      })
    },

    goHome () {
      ipcRenderer.send('changeWindow', {
        name: 'home'
      })
    },

    transNoteBookData (obj) {
      console.log('transNoteBookData', obj.noteBookId)
      return {
        type: 'folder',
        remote_id: obj.noteBookId,
        title: obj.title || '',
        seq: obj.seq || 0,
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        parent_folder: obj.parentId !== '0' ? obj.parentId : '/',
        trash: obj.trash,
        need_push: false
      }
    },

    transNoteData (obj) {
      console.log('transNoteData', obj)
      return {
        type: 'doc',
        title: obj.title || '',
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        parent_folder: obj.noteBookId !== '0' ? obj.noteBookId : '/',
        trash: obj.trash,
        file_size: obj.size,
        content: obj.noteContent,
        need_push: false
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
