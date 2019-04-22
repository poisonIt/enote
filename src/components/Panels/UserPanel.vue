<template>
  <div>
    <modal
      width="363px"
      height="301px"
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
        <div class="item">
          <span>同步时间</span>
          <span>{{ userInfo.position_name }}</span>
        </div>
      </div>
      <div class="button-group" slot="footer">
        <div class="button primary">开始同步</div>
        <div class="button">取消</div>
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
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  publishShare,
  unPublishShare
} from '../../service'
import Loading from '@/components/Loading'

export default {
  name: 'UserPanel',

  components: {
    Loading
  },

  data () {
    return {
      isSyncPanelShowed: false
    }
  },

  computed: {
    ...mapGetters({
      isUserPanelShowed: 'GET_SHOW_USER_PANEL',
      userInfo: 'GET_USER_INFO'
    })
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_USER_PANEL'
    ]),

    closeUserPanel () {
      this.TOGGLE_SHOW_USER_PANEL(false)
    },

    closeSyncPanel () {
      this.isSyncPanelShowed = false
    },

    openYoudaoWindow () {
      ipcRenderer.send('createWindow', {
        name: 'youdao',
        userCode: this.userInfo
      })
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

.popup__wrapper
  background-color transparent !important
</style>
