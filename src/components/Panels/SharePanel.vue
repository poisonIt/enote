<template>
  <div>
    <modal
      width="465px"
      height="317px"
      top="20vh"
      transition-name="fade-in-down"
      title="分享链接"
      @close="closeSharePanel"
      :visible.sync="isSharePanelShowed">
      <div class="share-panel">
        <div :class="{ lucency: isLoading }">
          <p style="font-size: 12px;margin-top: -10px;">链接生成成功，复制链接分享给好友吧</p>
          <div class="link" style="width: 100%; display: flex;">
            <input type="text"
              v-model="shareUrl"
              disabled="disabled"
              @click="handleLinkFocus"
              ref="linkInput">
            <div class="button primary">复制链接</div>
          </div>
          <div class="password">
            <form>
              <input type="checkbox" id="password-check">
              <label for="password-check">设置密码</label>
              <span style="margin-left: 10px;color: #333;user-select: all;">{{ sharePwd }}</span>
            </form>
          </div>
          <div class="validity">
            <span class="label">有效期</span>
            <BSelect :width="'100px'"
              v-model="validity"
              ref="validitySelect">
              <b-option
                v-for="(item, index) in validities"
                :key="index"
                :label="item.name"
                :value="item.id"
                :labelProxy="'name'"
                :valueProxy="'id'"
                :children="item.children">
              </b-option>
            </BSelect>
          </div>
          <div class="authority">
            <span class="label">设置访问权限</span>
            <BSelect :width="'150px'"
              v-model="entitledType"
              ref="entitledTypeSelect">
              <b-option
                v-for="(item, index) in authorities"
                :key="index"
                :label="item.name"
                :value="item.id"
                :labelProxy="'name'"
                :valueProxy="'id'"
                :children="item.children">
              </b-option>
            </BSelect>
            <div class="add-mem-button" @click="showFrdPanel">
              <div class="icon-mem"></div>
              添加可查看成员
            </div>
          </div>
          <div class="footer">
            <span class="cancel-button"
              v-show="!isLoading"
              @click="cancelShare">取消分享</span>
          </div>
        </div>
        <Loading class="loading" :type="8" fill="#DDAF59" v-if="isLoading"></Loading>
      </div>
    </modal>
    <modal
      class="frd-panel"
      width="408px"
      height="506px"
      top="10vh"
      transition-name="fade-in-down"
      title="选择微信好友"
      @close="closeFrdPanel"
      :visible.sync="isFrdPanelShowed">
      <div class="content">
        <div class="mem-list">
          <div class="search-input">
            <input type="text" v-model="fdSearchKey">
          </div>
          <ul>
            <label class="mem-item"
              v-for="item in fdList"
              :key="item.userCode"
              :class="{ hightlight: selectedFd === item }"
              @click="selectFdItem(item)">
              <img class="avatar" src="https://avatar.saraba1st.com/images/noavatar_middle.gif" alt="">
              <div class="name">{{ item.username }}</div>
              <input type="checkbox" @change="handleFriendStateChange" v-model="item.state">
            </label>
          </ul>
        </div>
        <div class="mem-selected">
          <div class="title">已选择({{ friendChecked.length }})</div>
          <ul>
            <label class="mem-item"
              v-for="item in friendChecked"
              :key="item.userCode">
              <img class="avatar" src="https://avatar.saraba1st.com/images/noavatar_middle.gif" alt="">
              <div class="name">{{ item.username }}</div>
              <div class="icon-close" @click="handleFriendUnChecked(item)"></div>
            </label>
          </ul>
        </div>
      </div>
      <div class="button-group" slot="footer">
        <div class="button primary">完成</div>
        <div class="button" @click="isFrdPanelShowed = false">取消</div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  publishShare,
  unPublishShare
} from '../../service'
import Loading from '@/components/Loading'

export default {
  name: 'SharePanel',

  components: {
    Loading
  },

  data () {
    return {
      isLoading: true,
      isSyncPanelShowed: false,
      isFrdPanelShowed: false,
      syncProgress: 0,
      fdSearchKey: '',
      selectedFd: null,
      fdList: [],
      friendChecked: [],
      validity: '000',
      shareUrl: '',
      sharePwd: '',
      entitledType: 'PUBLIC',
      validities: [
        {
          name: '永久有效',
          id: '0',
          children: []
        },
        {
          name: '1天',
          id: '1',
          children: []
        },
        {
          name: '7天',
          id: '7',
          children: []
        }
      ],
      authorities: [
        {
          name: '公开-所有人可查看',
          id: 'PUBLIC',
          children: []
        },
        {
          name: '私密-指定成员可查看',
          id: 'PRIVATE',
          children: []
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      isSharePanelShowed: 'GET_SHOW_SHARE_PANEL',
      userInfo: 'GET_USER_INFO',
      currentFile: 'GET_CURRENT_FILE'
    })
  },

  watch: {
    isSharePanelShowed (val) {
      if (val) {
        this.createShare()
      }
    },

    userInfo (val) {
      this.fdList = val.friend_list
    },

    validity (val) {
      console.log('watch-validity', val)
    },

    fdSearchKey (val) {
      if (val === '') {
        this.fdList = this.userInfo.friend_list
      }

      this.fdList = this.userInfo.friend_list
        .filter(item => item.username.indexOf(val) > -1)
    },

    entitledType (val) {
      console.log('entitledType', val)
    }
  },

  mounted () {
    // if (this.userInfo.friend_list.length > 0) {
    //   this.selectedFd = this.userInfo.friend_list[0]
    // }
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_SHARE_PANEL'
    ]),

    closeSharePanel () {
      this.TOGGLE_SHOW_SHARE_PANEL(false)
    },

    async createShare () {
      this.isLoading = true

      let shareResp = await publishShare({
        noteId: this.currentFile.remote_id,
        pwd: true
      })

      console.log('publishShare-resp', shareResp)

      this.isLoading = false
      if (shareResp.data.returnCode === 200) {
        this.shareInfo = shareResp.data.body
        this.shareUrl = this.shareInfo.url
        this.sharePwd = this.shareInfo.sharePwd
        this.entitledType = this.shareInfo.entitledType
        this.validity = String(this.shareInfo.validityType)

        this.$refs.validitySelect.broadcast('b-option', 'select', this.validity)
        this.$refs.validitySelect.selectedLabel = (this.validity === '0'
          ? '永久有效' : this.validity + '天')

        this.$refs.entitledTypeSelect.broadcast('b-option', 'select', this.entitledType)
        this.$refs.entitledTypeSelect.selectedLabel = (this.entitledType === 'PUBLIC'
          ? '公开-所有人可查看' : '私密-指定成员可查看')
      } else {
        this.TOGGLE_SHOW_SHARE_PANEL(false)
      }
    },

    async cancelShare () {
      this.isLoading = true

      let cancelResp = await unPublishShare({
        noteId: this.currentFile.remote_id
      })

      this.isLoading = false

      if (cancelResp.data.returnCode === 200) {
        this.TOGGLE_SHOW_SHARE_PANEL(false)
      }
    },

    handleLinkFocus () {
      console.log('handleLinkFocus')
      this.$refs.linkInput.select()
    },

    showFrdPanel () {
      console.log('showFrdPanel', this.isFrdPanelShowed)
      this.isFrdPanelShowed = true
    },

    closeFrdPanel () {
      this.isFrdPanelShowed = false
    },

    selectFdItem (item) {
      this.selectedFd = item
    },

    handleFriendStateChange () {
      this.friendChecked = this.userInfo.friend_list.filter(item => item.state)
    },

    handleFriendUnChecked (fd) {
      fd.state = false
      this.handleFriendStateChange()
    }
  }
}
</script>

<style lang="stylus" scoped>
.lucency
  opacity 0

.share-panel
  position relative
  font-size 13px
  line-height 40px
  color #999
  padding 20px 30px 0
  .link
    input
      width 320px
      height 28px
      border 1px solid #E9E9E9
      border-radius 4px
      padding-left 10px
      margin-right 10px
      outline none
  .password
    input[type="checkbox"]
      margin-right 10px
  .label
    width 100px
  .validity, .authority
    display flex
    align-items center
  .footer
    // display flex
    // flex 1
    // justify-content space-between
    margin-top 30px
  .cancel-button
    width 70px
    height 28px
    line-height 28px
    font-size 13px
    text-align center
    float right
    color #666666
    border 1px solid #E9E9E9
    border-radius 4px

.loading
  display flex
  width 100%
  height 100%
  left 0
  top 40px
  position absolute
  /* justify-items center */
  justify-content center
  align-items center

.add-mem-button
  margin-left 14px
  padding 0 8px
  height 28px
  line-height 28px
  color #DDAF59
  border 1px solid #DDAF59
  border-radius 4px
  text-align center
  display flex
  align-items center

.icon-mem
  width 12px
  height 12px
  margin-right 4px
  background-image url('../../assets/images/lanhu/mem@2x.png')
  background-size contain
  background-position center
  background-repeat no-repeat

.icon-weixin
  width 30px
  height 30px
  display flex
  align-items center
  justify-content center
  position absolute
  bottom 34px
  left 90px
  border-radius 50%
  font-size 16px
  line-height 16px
  text-align center
  background-color #3EB135
  color #fff

.frd-panel
  // margin-top -20px
  .modal__body
    padding 0 !important
  .content
    position relative
    display flex
    flex-direction row
    &::after
      content ''
      display block
      background-color #E9E9E9
      height 1px
      width 408px
      position absolute
      bottom 0
      left 0
    .mem-list
      flex .5
      border-right 1px solid #E9E9E9
      .search-input
        margin 10px 0
        position relative
        input
          width 151px
          height 24px
          line-height 24px
          outline none
          padding-left 30px
          margin-left 26px
          border 1px solid #E9E9E9
          border-radius 16px
        &::before
          position absolute
          left 36px
          top 50%
          transform translateY(-50%)
          content ''
          display block
          width 12px
          height 12px
          background-image url('../../assets/images/lanhu/search_normal@2x.png')
          background-size contain
          background-position center
          background-repeat no-repeat
      ul
        height 360px
        overflow-y scroll
    .mem-item
      display flex
      height 50px
      flex-direction row
      justify-content space-between
      align-items center
      padding 0 20px
      &.hightlight
        background-color #FFF5E2
      .avatar
        width 34px
        height 34px
        border-radius 50%
      .name
        flex .8
        margin 0 10px
        font-size 12px
        color #333333
    .mem-selected
      flex .5
      ul
        height 360px
        overflow-y scroll
      .title
        font-size 12px
        color #999
        margin 14px 20px 13px
  .icon-close
    width 13px
    height 13px
    border-radius 50%
    background-image url('../../assets/images/lanhu/close@2x.png')
    background-size contain
    background-position center
    background-repeat no-repeat
  
  .button-group
    position relative
    margin 0 auto
    top 16px
    left 0
    transform none
</style>

