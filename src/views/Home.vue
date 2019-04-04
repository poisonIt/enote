<template>
  <div class="home">
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
        <EditorComp style="height: 100%" v-show="currentFile && currentFile.type === 'doc'"></EditorComp>
        <FolderComp style="height: 100%" v-show="currentFile && currentFile.type === 'folder'"></FolderComp>
      </div>
    </PageLayout>
    <modal
      width="400px"
      height="464px"
      transition-name="fade-in-down"
      title="移动到"
      @close="closeMovePanel"
      :visible.sync="isMovePanelShowed">
      <Move ref="move" @handleMove="handleFileMoved"></Move>
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
          <span>哈啊哈</span>
        </div>
        <div class="item">
          <span>所属部门</span>
          <span>投资研究部</span>
        </div>
        <div class="item">
          <span>所属岗位</span>
          <span>研究员</span>
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
    <modal
      width="500px"
      height="340px"
      top="30vh"
      transition-name="fade-in-down"
      title="分享链接"
      @close="closeSharePanel"
      :visible.sync="isSharePanelShowed">
      <div class="share-panel">
        <p style="font-size: 12px;">链接生成成功，复制链接分享给好友吧</p>
        <div class="link" style="width: 100%; display: flex;">
          <input type="text">
          <div class="button primary">复制链接</div>
        </div>
        <div class="password">
          <form>
            <input type="checkbox" id="password-check">
            <label for="password-check">设置密码</label>
          </form>
        </div>
        <div class="validity">
          <span class="label">有效期</span>
          <BSelect :width="'100px'"
            v-model="validity">
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
          <BSelect :width="'150px'">
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
        </div>
        <div class="footer">
          <span>分享至</span>
          <span class="icon-weixin">
            <i class="fa fa-weixin" aria-hidden="true"></i>
          </span>
          <span style="color: #3161A3" @click="closeSharePanel">取消分享</span>
        </div>
      </div>
    </modal>
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
import EditorComp from '@/components/EditorComp.vue'
import FolderComp from '@/components/FolderComp.vue'
import ProgressBar from '@/components/ProgressBar'

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
    EditorComp,
    FolderComp,
    ProgressBar
  },

  data () {
    return {
      isSyncPanelShowed: false,
      syncProgress: 0,
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
      isSharePanelShowed: 'GET_SHOW_SHARE_PANEL'
    })
  },

  watch: {
    validity (val) {
      console.log('watch-validity', val)
    }
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_MOVE_PANEL',
      'TOGGLE_SHOW_USER_PANEL',
      'TOGGLE_SHOW_SHARE_PANEL',
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

    changeViewType () {
      this.SET_VIEW_TYPE(this.viewType === 'unexpanded' ? 'expanded' : 'unexpanded')
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

.share-panel
  font-size 13px
  line-height 40px
  color #4A4A4A
  .link
    input
      width 360px
      border 1px solid #13ABC4
      border-radius 2px
      padding-left 10px
      margin-right 20px
      outline none
  .password
    input
      margin-right 10px
  .label
    width 100px
  .validity, .authority
    display flex
    align-items center
  .footer
    display flex
    flex 1
    justify-content space-between
    margin-top 20px

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
