<template>
  <div>
    <modal
      width="390px"
      height="256px"
      top="20vh"
      transition-name="fade-in-down"
      title="偏好设置"
      @close="closeSettingPanel"
      :visible.sync="isSettingPanelShowed">
      <div class="setting-panel">
        <div class="form-item">
          <div class="form-label">服务地址(重启后生效)</div>
          <input type="text" v-model="serviceUrl">
          <span class="tip-error">非测试人员请勿更改!</span>
        </div>
        <div class="button-group" style="position: relative;top: 20px;">
          <div class="button primary" @click="deleteAllNote">清空笔记</div>
          <div class="button primary" @click="deleteAllData">清空所有数据</div>
        </div>
      </div>
      <div class="button-group" slot="footer">
        <div class="button primary" @click="saveSetting">保存</div>
        <div class="button" @click="closeSettingPanel">取消</div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getAppConf, saveAppConf } from '@/tools/appConf'
import { ipcRenderer } from 'electron'

export default {
  name: 'SettingPanel',

  data () {
    return {
      serviceUrl: ''
    }
  },

  computed: {
    ...mapGetters({
      isSettingPanelShowed: 'GET_SHOW_SETTING_PANEL'
    })
  },

  watch: {
  },

  created () {
    getAppConf(this.$remote.app.getAppPath('appData')).then(appConf => {
      this.serviceUrl = appConf.serviceUrl || ''
    })
  },

  mounted () {
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_SETTING_PANEL'
    ]),

    closeSettingPanel () {
      this.TOGGLE_SHOW_SETTING_PANEL(false)
    },

    saveSetting () {
      saveAppConf(this.$remote.app.getAppPath('appData'), {
        serviceUrl: this.serviceUrl
      }).then(() => {
        this.$Message.success('保存成功')
        this.closeSettingPanel()
      })
    },

    deleteAllNote () {
    },

    deleteAllData () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['deleteAll'],
        from: 'Setting',
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.setting-panel
  padding 20px
.form-item
  position relative
  width 100%
  display flex
  flex-direction row
  align-items baseline
  .form-label
    width 82px
    text-align left
  input
    width 260px
    padding-left 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    &:focus
      border 1px solid #DDAF59
  textarea
    width 85%
    height 46px
    line-height 24px
    margin-left 9px
    padding-left 10px
    margin-bottom 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    resize none
    &:focus
      border 1px solid #DDAF59
    &.error
      border-color red

.tip-error
  position absolute
  left 83px
  color #ed4014
  top 20px
</style>

