<template>
  <div>
    <modal
      width="363px"
      :height="'260px'"
      top="30vh"
      title="查看内容"
      transition-name="fade-in-down"
      @close="closeShareWithPanel"
      :visible.sync="isShareWithMePanelShowed">

      <div class="link">
        <textarea type="text" v-model="shareUrl" placeholder="请输入要查看内容的分享链接…"/>
      </div>

      <div class="button-group" slot="footer">
        <div class="button primary" @click="handleShareWithChecked">查看并保存</div>
        <div class="button" @click="closeShareWithPanel">取消</div>
      </div>
    </modal>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import { saveYoudaoShare, getShareWithMe } from '../../service/index.js'
  import { transNoteDataFromRemote } from '../../utils/mixins/transData.js'
  import fetchLocal from '../../utils/fetchLocal'
  import * as _ from 'lodash'
  import { ipcRenderer } from 'electron'
  export default {
    name: 'ShareWithMePanel',

    data() {
      return {
        shareUrl: '',
        userCode: ''
      }
    },

    computed: {
      ...mapGetters({
        isShareWithMePanelShowed: 'GET_SHOW_SHARE_WITH_ME',
        userInfo: 'GET_USER_INFO',
        currentFile: 'GET_CURRENT_FILE'
      })
    },
    created() {
      ipcRenderer.on('communicate', (event, args)=> {
        console.log(args)
        if (args.tasks[0] === 'pushData' && args.type === 'share') {
          this.$hub.dispatchHub('goShare', this)
        }
      })
    },
    methods: {

      ...mapActions([
        'TOGGLE_SHOW_SHARE_WITH_ME',
        'SET_CURRENT_NAV'
      ]),

      handleShareWithChecked (node) {
        saveYoudaoShare({ shareUrl: this.shareUrl, userCode: this.userInfo.usercode }).then(response => {
          if (response.data.returnCode === 200) {
            // 保存成功后打开查看笔记跳转到与我分享菜单
            // this.$hub.dispatchHub('goShare', this)
            // console.log(this.currentFile)
            this.$Message.success('保存成功，请稍等查看笔记')
            getShareWithMe().then(resp => {
              let notes = resp.data.body.map(item => transNoteDataFromRemote(item))
              fetchLocal('updateSharedNote', notes).then(res => {
                // console.log(res)
                res.forEach(item => {
                  if (item.remote_id === response.data.body.noteId) {
                    ipcRenderer.send('create-preview-window', {
                      noteId: item._id,
                      title: item.title,
                      isReadOnly: true,
                      type: 'share'
                    })
                    //
                  }
                })
              })
            })
            this.closeShareWithPanel()
          } else {
            this.$Message.error('请检查有道云链接是否正确')
          }
        })
      },

      closeShareWithPanel () {
        this.TOGGLE_SHOW_SHARE_WITH_ME(false)
        this.shareUrl = ''
      }
    },
  }
</script>

<style lang="stylus" scoped>
  .link
    width 100%
  textarea
    width 85%
    height 136px
    line-height 22px
    margin 20px auto
    display block
    // margin-left 9px
    padding 10px
    // margin-bottom 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    resize none
    &:focus
      border 1px solid #DDAF59
  .button-group
    bottom 15px !important
    left 70%

    .primary
      width 94px
</style>
