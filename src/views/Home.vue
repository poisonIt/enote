<template>
  <div class="home">
    <PageLayout>
      <div slot="left">
        <div id="nav">
          <FileTool></FileTool>
          <NavBar></NavBar>
        </div>
      </div>
      <div slot="middle">
        <DocumentList></DocumentList>
      </div>
      <div slot="right">
        <FileHandler></FileHandler>
        <EditorComp style="height: 100%" v-show="currentFile && currentFile.type === 'doc'"></EditorComp>
        <FolderComp style="height: 100%" v-show="currentFile && currentFile.type === 'folder'"></FolderComp>
      </div>
    </PageLayout>
    <modal
      width="400px"
      height="500px"
      transition-name="fade-in-down"
      title="移动到"
      @close="closeMovePanel"
      :visible.sync="isMovePanelShowed">
      <Move></Move>
      <div class="button-group" slot="footer">
        <div class="button primary">确定</div>
        <div class="button" @click="closeMovePanel">取消</div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Move from '@/components/Move'
import NavBar from '@/components/NavBar'
import FileTool from '@/components/FileTool'
import PageLayout from '@/components/PageLayout.vue'
import DocumentList from '@/components/DocumentList'
import FileHandler from '@/components/FileHandler.vue'
import EditorComp from '@/components/EditorComp.vue'
import FolderComp from '@/components/FolderComp.vue'

export default {
  name: 'home',

  components: {
    Move,
    NavBar,
    FileTool,
    PageLayout,
    DocumentList,
    FileHandler,
    EditorComp,
    FolderComp
  },

  computed: {
    ...mapGetters({
      isMovePanelShowed: 'GET_SHOW_MOVE_PANEL',
      viewFileType: 'GET_VIEW_FILE_TYPE',
      currentFile: 'GET_CURRENT_FILE'
    })
  },

  methods: {
    ...mapActions(['TOGGLE_SHOW_MOVE_PANEL']),

    closeMovePanel () {
      this.TOGGLE_SHOW_MOVE_PANEL()
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
</style>
