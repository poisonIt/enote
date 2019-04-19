<template>
  <div class="home">
    <button style="position: fixed;top: 30px;left: 20px;z-index: 9999999;" @click="resetData">reset</button>
    <button style="position: fixed;top: 30px;left: 160px;z-index: 9999999;" @click="goLogin">goLogin</button>
    <PageLayout>
      <div slot="left">
        <div id="nav">
          <User></User>
          <FileTool></FileTool>
          <NavBar ref="navbar"></NavBar>
          <div v-if="viewType === 'unexpanded'" class="expand-button" :class="{ unexpanded : viewType === 'unexpanded' }" @click="changeViewType"></div>
        </div>
      </div>
      <div slot="middle">
        <div v-if="viewType === 'expanded'" class="expand-switch" :class="{ unexpanded : viewType === 'unexpanded' }" @click="changeViewType"></div>
        <DocumentList></DocumentList>
      </div>
      <div slot="right">
        <FileHandler></FileHandler>
        <TagHandler></TagHandler>
        <Editor style="height: 100%" v-show="currentFile && currentFile.type === 'doc'"></Editor>
        <FolderComp style="height: 100%" v-show="currentFile && currentFile.type === 'folder'"></FolderComp>
      </div>
    </PageLayout>
    <modal
      width="400px"
      height="464px"
      transition-name="fade-in-down"
      title="移动到文件夹"
      @close="closeMovePanel"
      :visible.sync="isMovePanelShowed">
      <div style="padding: 10px 20px;">
        <Move ref="move" @handleMove="handleFileMoved"></Move>
      </div>
      <div class="button-group" slot="footer">
        <div class="button primary" @click="confirmMovePanel">保存</div>
        <div class="button" @click="closeMovePanel">取消</div>
      </div>
    </modal>
    <modal
      width="380px"
      height="240px"
      top="30vh"
      transition-name="fade-in-down"
      title="个人信息"
      @close="closeUserPanel"
      :visible.sync="isUserPanelShowed">
      <div class="user-info">
        <div class="item">
          <span>员工信息</span>
          <span>{{ userInfo.account_name_cn }}</span>
        </div>
        <div class="item">
          <span>所属部门</span>
          <span>{{ userInfo.department_name }}</span>
        </div>
        <div class="item">
          <span>所属岗位</span>
          <span>{{ userInfo.position_name }}</span>
        </div>
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
      <ProgressBar :value="syncProgress"></ProgressBar>
    </modal>
    <SharePanel></SharePanel>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import User from '@/components/User'
import Move from '@/components/Move'
import NavBar from '@/components/NavBar'
import FileTool from '@/components/FileTool'
import PageLayout from '@/components/PageLayout.vue'
import DocumentList from '@/components/DocumentList'
import FileHandler from '@/components/FileHandler.vue'
import TagHandler from '@/components/TagHandler.vue'
import Editor from '@/components/Editor'
import FolderComp from '@/components/FolderComp.vue'
import ProgressBar from '@/components/ProgressBar'
import SharePanel from '@/components/Panels/SharePanel'
import LocalDAO from '../../db/api'
import { ipcRenderer } from 'electron'

export default {
  name: 'home',

  components: {
    User,
    Move,
    NavBar,
    FileTool,
    PageLayout,
    DocumentList,
    FileHandler,
    TagHandler,
    Editor,
    FolderComp,
    ProgressBar,
    SharePanel
  },

  data () {
    return {
      isSyncPanelShowed: false,
      isFrdPanelShowed: false,
      syncProgress: 0,
      fdSearchKey: '',
      selectedFd: null,
      fdList: [],
      friendChecked: [],
      validity: '000',
      validities: [
        {
          name: '永久有效',
          id: '000',
          children: []
        },
        {
          name: '1天',
          id: '001',
          children: []
        },
        {
          name: '7天',
          id: '002',
          children: []
        }
      ],
      authorities: [
        {
          name: '公开-所有人可查看',
          id: '000',
          children: []
        },
        {
          name: '私密-指定成员可查看',
          id: '001',
          children: []
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      viewFileType: 'GET_VIEW_FILE_TYPE',
      viewType: 'GET_VIEW_TYPE',
      currentFile: 'GET_CURRENT_FILE',
      isMovePanelShowed: 'GET_SHOW_MOVE_PANEL',
      isUserPanelShowed: 'GET_SHOW_USER_PANEL',
      isSharePanelShowed: 'GET_SHOW_SHARE_PANEL',
      userInfo: 'GET_USER_INFO'
    })
  },

  watch: {
    validity (val) {
      console.log('watch-validity', val)
    },

    fdSearchKey (val) {
      if (val === '') {
        this.fdList = this.userInfo.friend_list
      }

      this.fdList = this.userInfo.friend_list
        .filter(item => item.username.indexOf(val) > -1)
    }
  },

  created () {
    this.SET_FILES_FROM_LOCAL()
    LocalDAO.user.get().then(resp => {
      console.log('userInfo', resp)
      this.fdList = resp.friend_list
      this.SET_USER_INFO(resp)
    })
  },

  mounted () {
    if (this.userInfo.friend_list.length > 0) {
      this.selectedFd = this.userInfo.friend_list[0]
    }
  },

  methods: {
    ...mapActions([
      'SET_FILES_FROM_LOCAL',
      'SET_USER_INFO',
      'TOGGLE_SHOW_MOVE_PANEL',
      'TOGGLE_SHOW_USER_PANEL',
      'TOGGLE_SHOW_SHARE_PANEL',
      'SET_FILE_PUSH_FINISHED',
      'SET_VIEW_TYPE'
    ]),

    closeMovePanel () {
      this.TOGGLE_SHOW_MOVE_PANEL()
      this.$refs.move.init()
    },

    confirmMovePanel () {
      this.$refs.move.handleMove()
    },

    handleFileMoved (id) {
      setTimeout(() => {
        this.$refs.navbar.setCurrentFolder(id)
        this.closeMovePanel()
      }, 300)
    },

    closeUserPanel () {
      this.TOGGLE_SHOW_USER_PANEL(false)
    },

    asyncUser () {
      this.isSyncPanelShowed = true

      const itvCb = () => {
        if (this.syncProgress < 100) {
          this.syncProgress++
        } else {
          clearInterval(itvCb)
          setTimeout(() => {
            this.isSyncPanelShowed = false
            this.TOGGLE_SHOW_USER_PANEL(false)
          }, 1000)
        }
      }
      setInterval(itvCb, 30)
    },

    closeSyncPanel () {
      this.isSyncPanelShowed = false
    },

    closeSharePanel () {
      this.TOGGLE_SHOW_SHARE_PANEL(false)
    },

    showFrdPanel () {
      console.log('showFrdPanel', this.isFrdPanelShowed)
      this.isFrdPanelShowed = true
    },

    closeFrdPanel () {
      this.isFrdPanelShowed = false
    },

    changeViewType () {
      this.SET_VIEW_TYPE(this.viewType === 'unexpanded' ? 'expanded' : 'unexpanded')
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
    },

    resetData () {
      LocalDAO.doc.removeAll()
      LocalDAO.tag.removeAll()
      LocalDAO.files.removeAll()
      LocalDAO.structure.remove()
      LocalDAO.tops.remove()
    },

    goLogin () {
      ipcRenderer.send('changeWindow', {
        name: 'login'
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.home
  // flex 1
  height 100%
  display flex
  flex-direction column

#nav
  position relative
  width 100%
  height 100%
  display flex
  flex-direction column
  // border-right 1px solid #e6e6e6
  a
    font-weight bold
    color #2c3e50
    &.router-link-exact-active
      color #42b983

.user-info
  font-size 12px
  line-height 48px
  color #333
  font-weight 600
  .item
    span:nth-of-type(1)
      display inline-block
      width 80px
      color #999999
      text-align right
      margin-right 20px

// .share-panel
//   font-size 13px
//   line-height 40px
//   color #999
//   padding 20px 30px 0
//   .link
//     input
//       width 320px
//       border 1px solid #E9E9E9
//       border-radius 4px
//       padding-left 10px
//       margin-right 10px
//       outline none
//   .password
//     input[type="checkbox"]
//       margin-right 10px
//   .label
//     width 100px
//   .validity, .authority
//     display flex
//     align-items center
//   .footer
//     // display flex
//     // flex 1
//     // justify-content space-between
//     margin-top 30px
//   .cancel-button
//     width 70px
//     height 28px
//     line-height 28px
//     font-size 13px
//     text-align center
//     float right
//     color #666666
//     border 1px solid #E9E9E9
//     border-radius 4px

// .add-mem-button
//   margin-left 14px
//   padding 0 8px
//   height 28px
//   line-height 28px
//   color #DDAF59
//   border 1px solid #DDAF59
//   border-radius 4px
//   text-align center
//   display flex
//   align-items center

// .icon-mem
//   width 12px
//   height 12px
//   margin-right 4px
//   background-image url('../assets/images/lanhu/mem@2x.png')
//   background-size contain
//   background-position center
//   background-repeat no-repeat

// .icon-weixin
//   width 30px
//   height 30px
//   display flex
//   align-items center
//   justify-content center
//   position absolute
//   bottom 34px
//   left 90px
//   border-radius 50%
//   font-size 16px
//   line-height 16px
//   text-align center
//   background-color #3EB135
//   color #fff

.expand-button
  width 70px
  height 60px !important
  position absolute !important
  left 0
  bottom 0
  background-image url('../assets/images/lanhu/view_expand@2x.png')
  background-size 40%
  background-position center
  background-repeat no-repeat

.expand-switch
  width 17px
  height 31px !important
  position absolute !important
  left -1px
  bottom 0
  border-radius 0 4px 4px 0
  background-color #3C3E44
  z-index 1
  &::after
    position absolute
    left 50%
    top 50%
    transform translate(-50%, -50%) rotate(180deg)
    content ''
    display block
    width 0
    height 0
    border-top 3px solid transparent
    border-left 4px solid #C2C2C2
    border-bottom 3px solid transparent
  &.unexpanded
    &::after
      transform translate(-50%, -50%) rotate(0)
</style>
