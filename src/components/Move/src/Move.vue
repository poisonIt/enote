<template>
  <div class="container">
    <div class="object">
      <div class="icon" :class="moveFile && moveFile.type"></div>
      <span class="name">{{ moveFile && moveFile.title }}</span>
    </div>
    <div class="document">
      <div class="path ellipsis">移动到:
        <span style="color: #828282">{{ path }}</span>
      </div>
      <div class="manager">
        <Tree
          :item-height="'40px'"
          :data="nav"
          :labelProxy="'name'"
          :expand-on-click-node="false"
          :prevent-default-click="true"
          default-expand-all
          ref="tree">
          <div class="nav-node" slot-scope="{ node, data }">
            <div class="icon-folder"></div>
            <div class="title ellipsis">{{ data.title }}</div>
            <div class="click-mask"
              @click="handleItemClick(node)">
            </div>
          </div>
        </Tree>
      </div>
    </div>
  </div>
</template>

<script>
import Tree from '@/components/Tree'
import mixins from '../mixins'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Move',

  mixins: mixins,

  components: {
    Tree
  },

  data () {
    return {
      path: '/',
      targetFolder: null,
      folderIndex: 0,
      nav: [{}]
    }
  },

  computed: {
    ...mapGetters({
      allFileMap: 'GET_FILES',
      moveFileId: 'GET_MOVE_FILE',
      currentFolder: 'GET_CURRENT_FOLDER'
    }),

    moveFile () {
      return this.allFileMap[this.moveFileId]
    }
  },

  methods: {
    ...mapActions([
      'MOVE_FILE',
      'SET_CURRENT_FOLDER'
    ]),

    init () {
      this.targetFolder = null
      // this.$refs.tree.store.currentNode = null
      this.path = '/'
    },

    handleMove () {
      if (this.targetFolder === null) {
        this.targetFolder = this.$refs.tree.store.root.data[0]
      }

      this.MOVE_FILE({
        fileId: this.moveFileId,
        targetId: this.targetFolder.id
      })

      this.$emit('handleMove', this.targetFolder.id)
      this.init()
    },

    handleItemClick (node) {
      node.instance.handleClick()
      this.targetFolder = node.data
      let pathArr = node.getAncestors()
        .filter(item => item.data.title)
        .map(item => item.data.title)

      if (node.level === 1) {
        this.path = '/'
        return
      } else if (node.level === 2) {
        pathArr[0] = ''
      } else if (node.level > 2) {
        pathArr[0] = '..'
      }
      this.path = pathArr.join('/')
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  width 100%
  height 100%
  // padding 40px 30px 0
  // border-radius 4px
  // border 1px solid #fff
  // background-color #f5f5f5
  // box-shadow 0px 3px 10px 1px rgba(0, 0, 0, 0.3)

.object
  width 100%
  display flex
  flex-direction row
  align-items center
  .icon
    width 30px
    height 30px
    border-radius 3px
    background-image url(../../../assets/images/document.png)
    background-repeat no-repeat
    background-position center
    background-size contain
    &.folder
      background-image url(../../../assets/images/folder.png)
  .name
    margin-left 20px
    font-size 12px
    line-height 48px
.document
  width 100%
  background-color #fff
  border-radius 4px
  border 1px solid #e6e6e6
  .path
    height 36px
    padding 0 10px
    border-bottom 1px solid #e6e6e6
    font-size 13px
    line-height 36px
  .manager
    width 100%
    height 240px
    overflow-y scroll

.nav-node
  position relative
  width 100%
  height 40px
  display flex
  align-items center
  font-size 13px
  -webkit-box-flex 1
  .click-mask
    position absolute
    width 100%
    height 100%

.icon-folder
  display block
  margin-right 6px
  width 24px
  height 24px
  opacity 0.8
  background-image url(../../../assets/images/folder-open-fill.png)
  background-repeat no-repeat
  background-size contain
  background-position center
</style>
