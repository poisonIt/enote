<template>
  <div>
    <modal
      width="363px"
      :height="'260px'"
      top="30vh"
      transition-name="fade-in-down"
      @close="close"
      :visible.sync="isShowed">
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
        <div class="item">
          <span>有道云账号</span>
          <span>{{ syncState }}</span>
          <span v-if="userInfo.sync_state === 'UNBIND'" class="async" @click="openYoudaoWindow">绑定账号</span>
        </div>
        <!-- <div class="item" v-if="userInfo.is_sync">
          <span>同步时间</span>
          <span>{{ userInfo.position_name }}</span>
        </div> -->
      </div>
      <div class="button-group" slot="footer" v-if="userInfo.sync_state !== 'PULL_SUCCESS'">
        <div class="button primary" :class="{ disabled: isSyncing }" @click="syncYoudao">
          <div class="loading" v-if="isSyncing">
            <Loading :type="1" fill="#fff" style="transform: scale(0.6) translate(0px, -13px)"></Loading>
          </div>
          <span v-else>开始同步</span>
        </div>
        <div class="button" @click="close">取消</div>
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
import * as _ from 'lodash'
import { ipcRenderer } from 'electron'
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  publishShare,
  unPublishShare,
  getSync,
  syncSate
} from '../../service'
import Loading from '@/components/Loading'
import fetchLocal from '../../utils/fetchLocal'

export default {
  name: '',

  components: {
    Loading
  },

  data () {
    return {
      isSyncing: false,
      isOauthed: false,
      isOauthPanelShowed: false,
      isSyncPanelShowed: false
    }
  },

  watch: {
    userInfo (val) {
      console.log('watch-userInfo', val)
    }
  },

  computed: {
    ...mapGetters({
      isShowed: 'GET_SHOW_USER_PANEL',
      userInfo: 'GET_USER_INFO'
    }),

    syncState () {
      switch (this.userInfo.sync_state) {
        case 'UNBIND':
          return '未绑定'
        case 'BIND':
          return '已经绑定'
        case 'PULL_ERROR':
          return '同步失败'
        case 'PULL_SUCCESS':
          return '同步完成'
        default:
          return '未绑定'
      }
    }
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_USER_PANEL',
      'SET_USER_INFO'
    ]),

    close () {
      this.TOGGLE_SHOW_USER_PANEL(false)
    },

    closeOauthPanel () {
      this.isOauthPanelShowed = false
    },

    closeSyncPanel () {
      this.isSyncPanelShowed = false
    },

    openYoudaoWindow () {
      if (!this.userInfo.usercode) {
        alert('userCode empty!')
        return
      }
      let redirect_uri = `https://iapp.htffund.com/note/api/youdao/callBack`
      let url = `https://note.youdao.com/oauth/authorize2?client_id=838948a8e2be4d35f253cb82f2687d15&response_type=code&redirect_uri=${redirect_uri}/&state=${this.userInfo.usercode}`
      console.log('youdaoSyncUrl', url)
      ipcRenderer.send('create-youdao-window', {
        name: 'youdao',
        userCode: this.userInfo,
        url: url
      })
      this.isOauthPanelShowed = true
    },

    async checkYoudaoSyncState () {
      syncSate().then(resp => {
        if (resp.data.returnCode === 200) {
          let userInfo = _.clone(this.userInfo)
          userInfo.sync_state = resp.data.body.state
          this.SET_USER_INFO(userInfo)
          this.closeOauthPanel()
        }
      })
    },

    async syncYoudao () {
      if (this.isSyncing) {
        return
      }
      this.isSyncing = true
      try {
        let youdaoSync = await getSync({ deviceId: this.$remote.app.appConf.clientId })
        if (youdaoSync.data.returnCode === 200) {
          await fetchLocal('removeAll')
          this.$hub.dispatchHub('pullData', this)
          let userInfo = _.clone(this.userInfo)
          userInfo.sync_state = 'PULL_SUCCESS'
          fetchLocal('updateLocalUser', userInfo)
          setTimeout(() => {
            this.isSyncing = false
            this.SET_USER_INFO(userInfo)
          }, 3000)
        } else {
          this.isSyncing = false
          this.$Message.error('同步失败，请稍后重试')
        }
      } catch (err) {
        this.isSyncing = false
        this.$Message.error('网络错误，请稍后重试')
      }
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

.disabled
  background-color #a2a2a2 !important

.button-group
  bottom 20px
  &.oauth
    width 70% !important
    bottom 32px !important

.popup__wrapper
  background-color transparent !important
</style>
