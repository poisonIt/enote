<template>
  <div class="container" :class="{ 'is-expanded' : viewType === 'expanded' }">
    <div class="expanded" v-if="viewType === 'expanded'">
      <div class="item new" @click="toggleMenu">
        <div class="icon-new"></div>
        <span>新建</span>
      </div>
      <div class="item sync" @click="syncData">
        <div class="icon-sync infinite rotate" :class="{ animated: isSyncing }"></div>
        <span>同步</span>
      </div>
    </div>
    <div class="button-sync" v-if="viewType === 'unexpanded'"></div>
    <div class="unexpanded" v-if="viewType === 'unexpanded'">+</div>
    <Menu
      :data="menuData"
      :visible="isMenuVisible"
      @close="closeMenu"
      @itemClick="handleMenuClick">
    </Menu>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import pReduce from 'p-reduce'
import { pushNotebook, pushNote } from '@/service'


export default {
  name: 'FileTool',

  data () {
    return {
      isMenuVisible: false,
      menuData: [
        {
          label: '新建模板笔记',
          value: 'new_doc'
        },
        {
          label: '新建文件夹',
          value: 'new_folder'
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      viewType: 'GET_VIEW_TYPE',
      allFileMap: 'GET_FILES',
      isSyncing: 'GET_IS_SYNCING',
      userInfo: 'GET_USER_INFO',
      filesNeedPush: 'GET_FILES_NEED_PUSH'
    })
  },

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
      'SET_FILE_PUSH_FINISHED'
    ]),

    toggleMenu () {
      this.isMenuVisible = !this.isMenuVisible
    },

    closeMenu () {
      this.isMenuVisible = false
    },

    newDoc () {
      // this.$hub.dispatchHub('newDoc', this)
      this.$hub.dispatchHub('newTemplateDoc', this)
    },

    newFolder () {
      this.$hub.dispatchHub('newFolder', this)
    },

    handleMenuClick (value) {
      if (value === 'new_doc') {
        this.newDoc()
      } else if (value === 'new_folder') {
        this.newFolder()
      }
    },

    tranData (file) {
      let parentFolder = this.allFileMap[file.parent_folder]

      if (file.type === 'folder') {
        return {
          noteBookId: file.remote_id || file.id,
          parentId: parentFolder ? parentFolder.remote_id : '/',
          seq: file.seq,
          title: file.title,
          trash: file.trash
        }
      } else if (file.type === 'doc') {
        return {
          noteBookId: parentFolder ? parentFolder.remote_id : '/',
          noteContent: file.content,
          noteId: file.remote_id || file.id,
          title: file.title,
          trash: file.trash
        }
      }
    },

    createPromise (data, type) {
      if (type === 'folder') {
        return new Promise ((resolve, reject) => {
          pushNotebook(this.userInfo.id_token, data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              alert(resp.data.returnMsg)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'doc') {
        return new Promise ((resolve, reject) => {
          pushNote(this.userInfo.id_token, data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              alert(resp.data.returnMsg)
              reject(resp.data.returnMsg)
            }
          })
        })
      }
    },

    async pushData (foldersNeedPushByDepth, foldersNeedPush, docsNeedPush) {
      let folderPromises = foldersNeedPushByDepth.map(files => {
        let data = files.map(file => {
          return this.tranData(file)
        })
        return this.createPromise(data, 'folder')
      })

      let docPromises = this.createPromise(
        docsNeedPush.map(file => {
          return this.tranData(file, 'doc')
        })
      , 'doc')

      let noteBookRes = await pReduce(folderPromises, async (total, res) => {
        if (total === 0) {
          total = []
        }
        console.log('folderPromises-res', res)
        return [...total, ...res]
      }, 0)

      let noteRes = await docPromises
      console.log('noteBookRes', noteBookRes, noteRes)
      foldersNeedPush.forEach((item, index) => {
        this.SET_FILE_PUSH_FINISHED({
          id: item.id,
          remote_id: noteBookRes[index].noteBookId
        })
      })
      docsNeedPush.forEach((item, index) => {
        this.SET_FILE_PUSH_FINISHED({
          id: item.id,
          remote_id: noteRes[index].noteBookId
        })
      })
      this.SET_IS_SYNCING(false)
    },

    syncData () {
      let foldersNeedPush = this.filesNeedPush
        .filter(item => item.type === 'folder')
        .sort((a, b) => a.depth - b.depth)

      let foldersNeedPushByDepth = []

      let docsNeedPush = this.filesNeedPush
        .filter(item => item.type === 'doc')

      if (foldersNeedPush.length + docsNeedPush.length === 0) return
      console.log('syncData', foldersNeedPush, docsNeedPush)
      this.SET_IS_SYNCING(true)
      if (foldersNeedPush.length > 0) {
        let minDepth = foldersNeedPush[0].depth
        let maxDepth = foldersNeedPush[foldersNeedPush.length - 1].depth
  
        for (let i = minDepth; i <= maxDepth; i++) {
          let arr = foldersNeedPush.filter(item => item.depth === i)
          if (arr.length > 0) {
            foldersNeedPushByDepth.push(arr)
          }
        }
      }


      this.pushData(foldersNeedPushByDepth, foldersNeedPush, docsNeedPush)
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  position relative
  width 100%
  height 120px
  display flex
  flex-direction column
  justify-content space-evenly
  align-items center
  &.is-expanded
    height 60px
    display block
  &::after
    content ''
    display block
    width 100%
    height 1px
    background-color #000
    position absolute
    bottom 0
    left 50%
    transform translateX(-50%) scaleY(.3)

.expanded
  width 100%
  height 100%
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  padding 0 10px

.item
  width 135px
  height 36px
  display flex
  flex-direction row
  justify-content space-evenly
  align-items center
  padding 10px
  border-radius 3px
  font-size 14px
  color #C2C2C2

.new
  &::after
    content ''
    width 0
    height 0
    margin-left 10px
    border-top 3px solid transparent
    border-left 4px solid #C2C2C2
    border-bottom 3px solid transparent
    transform rotate(90deg)

.icon-new, .icon-sync
  width 19px
  height 19px
  display block
  font-size 20px
  font-weight 600
  margin-right 10px
  background-repeat no-repeat
  background-size contain
  background-position center

.icon-new
  background-image url(../assets/images/lanhu/new@2x.png)
.icon-sync
  background-image url(../assets/images/lanhu/sync@2x.png)

.expand
  position relative
  width 36px
  height 36px
  border-radius 3px
  background-color #3161A3
  color #fff
  &::before
    position absolute
    top 50%
    left 60%
    content '>'
    display block
    font-size 14px
    font-weight 500
    transform scaleX(1.8) translate(-50%, -50%) rotate(90deg)

.button-sync,.unexpanded
  width 26px
  height 26px

.button-sync
  background-image url(../assets/images/lanhu/sync@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center

.unexpanded
  // position absolute
  // top 50%
  // left 50%
  // transform translate(-50%, -50%)
  border-radius 50%
  font-size 20px
  color #fff
  text-align center
  line-height 28px
  background-color #DDAF59
</style>
