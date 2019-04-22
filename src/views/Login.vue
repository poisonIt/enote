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
import { mapActions } from 'vuex';

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
    ...mapActions([
      'SET_TOKEN'
    ]),

    async postData () {
      if (this.isLoading) return
      this.isLoading = true
      const { username, password } = this

      authenticate({
        username: username,
        password: password
      }).then(resp => {
        if (resp.data.returnCode === 200) {
          const id_token = resp.data.body.id_token
          this.SET_TOKEN(id_token)

          Promise.all([
            this.pullUserInfo(id_token, username, password),
            pullNotebooks(),
            pullNote(),
            pullTags()
          ]).then(pullResp => {
            console.log('pullResp', pullResp)
            LocalDAO.tag.removeAll().then(() => {
              LocalDAO.files.removeAll().then(() => {
              if (pullResp[0].returnMsg !== 'success') {
                // alert(`获取用户信息：${pullResp[0].returnMsg}`)
                this.isLoading = false
                return
              }

              if (pullResp[1].data.returnMsg !== 'success') {
                // alert(`获取笔记本：${pullResp[1].data.returnMsg}`)
                this.isLoading = false
                return
              }

              if (pullResp[2].data.returnMsg !== 'success') {
                // alert(`获取笔记：${pullResp[2].data.returnMsg}`)
                this.isLoading = false
                return
              }

              if (pullResp[3].data.returnMsg !== 'success') {
                // alert(`获取标签：${pullResp[3].data.returnMsg}`)
                this.isLoading = false
                return
              }

                const saveUserInfoTask = LocalDAO.user.update(pullResp[0].userData)

                const saveNoteBooksTask = pullResp[1].data.body
                  .map(item => LocalDAO.files.add(this.transNoteBookData(item)))

                const saveNoteTask = pullResp[2].data.body
                  .map(item => LocalDAO.files.add(this.transNoteData(item)))

                const saveTagTask = (pullResp[3].data.body || [])
                  .map(item => LocalDAO.tag.add(this.transTagData(item)))

                Promise.all([saveUserInfoTask, ...saveNoteBooksTask, ...saveNoteTask, ...saveTagTask])
                  .then(saveLocalRes => {
                    console.log('saveLocalRes', saveLocalRes)
                    this.isLoading = false
                    // setTimeout(() => {
                    this.goHome()
                    // }, 10000)
                  })
              })
            })
          })
        } else {
          this.isLoading = false
        }
      })
    },

    async pullUserInfo (id_token, username, password) {
      const userInfoResp = await getUserInfo(id_token)
      if (userInfoResp.data.returnCode !== 200) {
        return {
          returnMsg: userInfoResp.data.returnMsg
        }
      }

      const friendResp = await getFriendList(id_token)
      if (friendResp.data.returnCode !== 200) {
        return {
          returnMsg: friendResp.data.returnMsg
        }
      }

      const userDataTransed = this.transUserData(userInfoResp.data.body)
      userDataTransed.password = password
      userDataTransed.id_token = id_token
      userDataTransed.friend_list = friendResp.data.body
      console.log('userDataTransed', userDataTransed)
      return {
        userData: userDataTransed,
        returnMsg: friendResp.data.returnMsg
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
    },

    transNoteBookData (obj) {
      console.log('transNoteBookData', obj.noteBookId, obj.title, obj)
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
      console.log('transNoteData', obj.noteId, obj.title, obj)
      return {
        type: 'doc',
        remote_id: obj.noteId,
        title: obj.title || '',
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        parent_folder: obj.noteBookId !== '0' ? obj.noteBookId : '/',
        trash: obj.trash,
        file_size: obj.size,
        content: obj.noteContent,
        tags: obj.tagId.filter(item => item),
        need_push: false,
        top: obj.top
      }
    },

    transTagData (obj) {
      return {
        name: obj.tagName,
        remote_id: obj.tagId
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
