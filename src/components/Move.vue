<template>
  <div class="container">
    <div class="object">
      <div class="icon"></div>
      <span class="name">新建文件夹</span>
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

export default {
  name: 'Move',

  components: {
    Tree
  },

  data () {
    return {
      path: '',
      nav: [
        {
          title: '我的文件夹',
          link: 'folders',
          type: 'folder',
          children: [
            {
              title: '我的资源',
              link: 'resources',
              type: 'folder',
              isTyping: true,
              children: [
                {
                  title: '新建文件夹',
                  link: 'new folder',
                  type: 'folder',
                  children: [
                    {
                      title: '新建文件夹新建文件夹新建文件夹新建文件夹新建文件夹新建文件夹新建文件夹',
                      link: 'new folder',
                      type: 'folder'
                    }
                  ]
                },
                {
                  title: '新建文件夹1',
                  link: 'new folder',
                  type: 'folder',
                  children: [
                    {
                      title: '新建文件夹2',
                      link: 'new folder',
                      type: 'folder'
                    },
                    {
                      title: '1111111',
                      link: 'new folder',
                      type: 'folder'
                    },
                    {
                      title: '1111111',
                      link: 'new folder',
                      type: 'folder'
                    },
                    {
                      title: '1111111',
                      link: 'new folder',
                      type: 'folder'
                    },
                    {
                      title: '1111111',
                      link: 'new folder',
                      type: 'folder'
                    },
                    {
                      title: '1111111',
                      link: 'new folder',
                      type: 'folder'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },

  methods: {
    handleClose () {
    },

    handleItemClick (node) {
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
    height 20px
    background-color orange
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
  height 100%
  display flex
  align-items center
  font-size 13px
  -webkit-box-flex 1
  .click-mask
    position absolute
    width 100%
    height 100%
</style>
