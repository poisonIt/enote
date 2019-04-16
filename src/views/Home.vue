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
    <modal
      width="465px"
      height="317px"
      top="20vh"
      transition-name="fade-in-down"
      title="分享链接"
      @close="closeSharePanel"
      :visible.sync="isSharePanelShowed">
      <div class="share-panel">
        <p style="font-size: 12px;margin-top: -10px;">链接生成成功，复制链接分享给好友吧</p>
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
          <div class="add-mem-button" @click="showFrdPanel">
            <div class="icon-mem"></div>
            添加可查看成员
          </div>
        </div>
        <div class="footer">
          <!-- <span>分享至</span>
          <span class="icon-weixin">
            <i class="fa fa-weixin" aria-hidden="true"></i>
          </span> -->
          <span class="cancel-button" @click="closeSharePanel">取消分享</span>
        </div>
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
            <input type="text">
          </div>
          <ul>
            <li class="mem-item" v-for="item in 10" :key="item">
              <img class="avatar" src="https://avatar.saraba1st.com/images/noavatar_middle.gif" alt="">
              <label class="name">张小仙</label>
              <input type="checkbox">
            </li>
          </ul>
        </div>
        <div class="mem-selected">
          <div class="title">已选择({{4}})</div>
          <ul>
            <li class="mem-item" v-for="item in 10" :key="item">
              <img class="avatar" src="https://avatar.saraba1st.com/images/noavatar_middle.gif" alt="">
              <label class="name">张小仙</label>
              <input type="checkbox">
            </li>
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
import LocalDAO from '../../db/api'
import { pushNotebook, pushNote } from '../service'
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
    ProgressBar
  },

  data () {
    return {
      isSyncPanelShowed: false,
      isFrdPanelShowed: false,
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
      isSharePanelShowed: 'GET_SHOW_SHARE_PANEL',
      userInfo: 'GET_USER_INFO',
      filesNeedPush: 'GET_FILES_NEED_PUSH'
    })
  },

  watch: {
    validity (val) {
      console.log('watch-validity', val)
    }
  },

  mounted () {
    setInterval(() => {
      this.filesNeedPush.forEach(file => {
        if (file.type === 'folder') {
          pushNotebook(this.userInfo.id_token, {
            noteBookId: file.id,
            parentId: file.parent_folder,
            seq: file.seq,
            title: file.title,
            trash: file.trash
          }).then(resp => {
            if (resp.data.returnCode === 200) {
              this.SET_FILE_PUSH_FINISHED(file.id)
            }
          })
        } else if (file.type === 'doc') {
          console.log(file.title, file.parent_folder)
          pushNotebook(this.userInfo.id_token, {
            noteBookId: file.parent_folder,
            noteContent: file.content,
            noteId: file.id,
            title: file.title,
            trash: file.trash
          }).then(resp => {
            if (resp.data.returnCode === 200) {
              this.SET_FILE_PUSH_FINISHED(file.id)
            }
          })
        }
      })
    }, 5000)
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

    resetData () {
      LocalDAO.doc.removeAll()
      LocalDAO.tag.removeAll()
      LocalDAO.files.removeAll()
      LocalDAO.structure.remove()
      LocalDAO.tops.remove()
    },

    goLogin () {
      console.log('goLogin')
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

.share-panel
  font-size 13px
  line-height 40px
  color #999
  padding 20px 30px 0
  .link
    input
      width 320px
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
  background-image url('../assets/images/lanhu/mem@2x.png')
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
          background-image url('../assets/images/lanhu/search_normal@2x.png')
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
  .button-group
    position relative
    margin 0 auto
    top 16px
    left 0
    transform none
</style>
