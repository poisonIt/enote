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
          ref="tree"
          :model="folderTree"
          default-tree-node-name="新建文件夹"
          v-bind:default-expanded="true"
          :mask-style="{
            width: '359px',
            left: '21px',
            border: 'none'
          }"
          @set-current="handleSetCurrentFolder">
        </Tree>
        <!-- <Tree
          :item-height="'40px'"
          :data="nav"
          :labelProxy="'name'"
          :expand-on-click-node="false"
          :prevent-default-click="true"
          default-expand-all
          ref="tree">
          <div class="nav-node" slot-scope="{ node, data }">
            <div class="icon-folder" :class="iconClassComputed(node)"></div>
            <div class="title ellipsis">{{ data.title }}</div>
            <div class="click-mask"
              @click="handleItemClick(node)">
            </div>
          </div>
        </Tree> -->
      </div>
    </div>
  </div>
</template>

<script>
// import Tree from '@/components/Tree'
import { Tree, TreeStore } from '@/components/Tree'
import { mapGetters, mapActions } from 'vuex'
import { ipcRenderer } from 'electron'

const rootFolder = {
  name: '我的文件夹',
  id: '0',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'folder'
  }
}

export default {
  name: 'Move',

  components: {
    Tree
  },

  data () {
    return {
      path: '/',
      targetFolder: null,
      folderIndex: 0,
      folderTree: new TreeStore([rootFolder]),
      moveFile: {
        title: '',
        type: ''
      }
    }
  },

  computed: {
    ...mapGetters({
      // allFileMap: 'GET_FILES',
      // moveFileId: 'GET_MOVE_FILE',
      // currentFolder: 'GET_CURRENT_FOLDER'
    }),

    // moveFile () {
      // return this.allFileMap[this.moveFileId]
    // }
  },

  methods: {
    ...mapActions([
      'APPEND_FILE',
      'SET_CURRENT_FOLDER'
    ]),

    init (tree, file) {
      this.targetFolder = null
      this.path = '/'
      console.log('init', tree, file)
      this.folderTree = new TreeStore([tree])
      this.moveFile = file
    },

    handleSetCurrentFolder (node) {
      this.path = this.getPath(node)
      console.log('handleSetCurrentFolder', node)
      this.targetFolder = node.data
      this.targetFolderNode = node
    },

    handleMove () {
      console.log('handleMove', this.targetFolder, this.targetFolderNode, this.moveFile)
      if (!this.targetFolder) {
        return
      }
      if (!this.targetFolder.id) {
        this.targetFolder.id = '0'
      }
      const c = this.$refs.tree.model.store.map[this.moveFile.id]
      console.log('handleMove-c', c)
      // const t = this.$refs.tree.model.store.map[this.targetFolder.id]
      if (c.isTargetChild(this.targetFolderNode)) {
        return
      }
      c.moveInto(this.targetFolderNode)

      if (this.moveFile.pid !== this.targetFolderNode.id &&
        this.moveFile.id !== this.targetFolderNode.id) {
        let taskName = this.moveFile.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'
        ipcRenderer.send('fetch-local-data', {
          tasks: [taskName],
          params: [{
            id: this.moveFile.id,
            pid: this.targetFolderNode.id
          }],
          from: ['Move']
        })
      }


      console.log('handleMove', this.$refs.tree.model)
      this.$emit('handleMove', {
        moveId: this.moveFile.id,
        targetId: this.targetFolderNode.id
      })
      // this.init()
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
    },

    iconClassComputed (node) {
      let pre = ''
      if (node.data.type === 'folder') {
        pre = (node.expanded ? 'icon-folder_open' : 'icon-folder_close')
      } else {
        pre = `icon-${node.data.link}`
      }
      return `${pre} ${node.store.currentNode === node ? 'highlight' : ''}`
    },

    getPath (node) {
      let c = node
      let result = [c.name]
      console.log('getPath', c)
      while (c.parent && c.parent.name !== 'root') {
        result.unshift(c.parent.name || '')
        c = c.parent
      }
      return result.join('/')
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
    width 20px
    height 20px
    border-radius 3px
    background-image url(../../../assets/images/lanhu/doc@2x.png)
    background-repeat no-repeat
    background-position center
    background-size contain
    &.folder
      background-image url(../../../assets/images/lanhu/folder@2x.png)
  .name
    margin-left 10px
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

.tn-mask
  width 359px !important
  left 21px !important

// .nav-node
//   position relative
//   width 100%
//   height 40px
//   display flex
//   align-items center
//   font-size 13px
//   -webkit-box-flex 1
//   .click-mask
//     position absolute
//     width 100%
//     height 100%

// .icon-folder_open
//   background-image url(../../../assets/images/lanhu/folder_open@2x.png)
//   &.highlight
//     background-image url(../../../assets/images/lanhu/folder_open_highlight@2x.png)
// .icon-folder_close
//   background-image url(../../../assets/images/lanhu/folder_close@2x.png)
//   &.highlight
//     background-image url(../../../assets/images/lanhu/folder_close_highlight@2x.png)

// .icon-folder
//   display block
//   margin-right 6px
//   width 24px
//   height 24px
//   opacity 0.8
//   background-image url(../../../assets/images/lanhu/folder_open_highlight@2x.png)
//   background-repeat no-repeat
//   background-size contain
//   background-position center
</style>
