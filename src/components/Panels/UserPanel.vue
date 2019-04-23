<template>
  <div>
    <modal
      width="363px"
      :height="userInfo.is_sync ? '301px' : '250px'"
      top="30vh"
      transition-name="fade-in-down"
      @close="closeUserPanel"
      :visible.sync="isUserPanelShowed">
      <div slot="title" class="title">个人信息</div>
      <div class="user-info">
        <div class="item">
          <span>员工信息</span>
          <span>{{ userInfo.account_name_cn || userInfo.username }}</span>
        </div>
        <div class="item">
          <span>所属部门</span>
          <span>{{ userInfo.department_name }}</span>
        </div>
        <div class="item">
          <span>所属岗位</span>
          <span>{{ userInfo.position_name }}</span>
        </div>
        <div class="item" v-if="!userInfo.is_sync">
          <span>有道云账号</span>
          <span>尚未绑定有道云账号</span>
          <span class="async" @click="openYoudaoWindow">绑定账号</span>
        </div>
        <div class="item" v-if="userInfo.is_sync">
          <span>同步时间</span>
          <span>{{ userInfo.position_name }}</span>
        </div>
      </div>
      <div class="button-group" slot="footer" v-if="userInfo.is_sync">
        <div class="button primary">开始同步</div>
        <div class="button">取消</div>
      </div>
    </modal>
    <modal
      width="300px"
      height="140px"
      top="40vh"
      transition-name="fade-in-down"
      title="是否完成绑定？"
      @close="closeOauthPanel"
      :visible.sync="isOauthPanelShowed">
      <div class="button-group oauth" slot="footer">
        <div class="button primary" @click="checkYoudaoSyncState">已完成</div>
        <div class="button" @click="closeOauthPanel">未完成</div>
      </div>
    </modal>
    <modal
      width="500px"
      height="280px"
      top="32vh"
      transition-name="fade-in-down"
      title="有道云笔记同步"
      @close="closeSyncPanel"
      :visible.sync="isSyncPanelShowed">
      <p style="font-size: 12px;margin: 50px 20px 20px">数据同步中...</p>
      <!-- <ProgressBar :value="syncProgress"></ProgressBar> -->
    </modal>
    <!-- <webview src="https://note.youdao.com/oauth/authorize2?client_id=838948a8e2be4d35f253cb82f2687d15&response_type=code&redirect_uri=https://iapp.htffund.com"></webview> -->
  </div>
</template>

<script>
import { ipcRenderer, BrowserWindow } from 'electron'
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  publishShare,
  unPublishShare,
  getSync,
  syncSate
} from '../../service'
import Loading from '@/components/Loading'

export default {
  name: 'UserPanel',

  components: {
    Loading
  },

  data () {
    return {
      isOauthPanelShowed: false,
      isSyncPanelShowed: false
    }
  },

  computed: {
    ...mapGetters({
      isUserPanelShowed: 'GET_SHOW_USER_PANEL',
      userInfo: 'GET_USER_INFO'
    })
  },

  mounted () {
    console.log('userInfo', this.userInfo)
    ipcRenderer.on('youdao-reply', (event, arg) => {
      console.log('youdao-reply', arg)
    })
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_USER_PANEL'
    ]),

    closeUserPanel () {
      this.TOGGLE_SHOW_USER_PANEL(false)
    },

    closeOauthPanel () {
      this.isOauthPanelShowed = false
    },

    closeSyncPanel () {
      this.isSyncPanelShowed = false
    },

    openYoudaoWindow () {
      console.log('openYoudaoWindow', this.userInfo)
      if (!this.userInfo.usercode) {
        alert('userCode empty!')
        return
      }
      let redirect_uri = `https://www.htffund.com/rest/note/api/youdao/callBack`
      let url = `https://note.youdao.com/oauth/authorize2?client_id=838948a8e2be4d35f253cb82f2687d15&response_type=code&redirect_uri=${redirect_uri}/&state=${this.userInfo.usercode}`
      // let url = `https://note.youdao.com/signIn/index.html?back_url=https%3A%2F%2Fnote.youdao.com%2Foauth%2Fauthorize2%3Fredirect_uri%3Dhttps%253A%252F%252Fiapp.htffund.com%252F%26client_id%3D838948a8e2be4d35f253cb82f2687d15%26state%3D123%26response_type%3Dcode`
      console.log('url', url)
      // window.open('https://note.youdao.com/oauth/authorize2?client_id=838948a8e2be4d35f253cb82f2687d15&response_type=code&redirect_uri=https://iapp.htffund.com')
      // return
      ipcRenderer.send('createWindow', {
        name: 'youdao',
        userCode: this.userInfo,
        url: url
      })
      this.isOauthPanelShowed = true
    },

    async checkYoudaoSyncState () {
      let youdaoSync = await getSync()
      let syncState = await syncSate()
      console.log('youdaoSync', youdaoSync)
      console.log('syncSate', syncSate)
    }
  }
}
</script>

<style lang="stylus" scoped>
.user-info
  font-size 12px
  line-height 14px
  color #333
  font-weight 600
  padding 30px 0
  .item
    span:nth-of-type(1)
      display inline-block
      width 80px
      color #999999
      text-align right
      margin-right 20px
      margin-bottom 20px

.title
  width 100%
  text-align center
  font-size 14px
  color #333
  font-weight 500

.async
  color #DDAF59
  float right
  margin-right 24px

.button-group
  bottom 20px
  &.oauth
    width 70% !important
    bottom 32px !important

.popup__wrapper
  background-color transparent !important
</style>
