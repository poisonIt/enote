<template>
  <div class="container" :class="{ 'is-expanded' : viewType === 'expanded' }">
    <div class="expanded" v-if="viewType === 'expanded'">
      <div class="item new" @click="toggleMenu">
        <div class="icon-new"></div>
        <span>新建</span>
      </div>
      <div class="item sync" @click="asyncData">
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
import { mapGetters } from 'vuex'
import pullData from '@/utils/mixins/pullData'
import pushData from '@/utils/mixins/pushData'

export default {
  name: 'FileTool',

  mixins: [ pullData, pushData ],

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
      isEditorFocused: 'GET_IS_EDITOR_FOCUSED'
    })
  },

  mounted () {
    // let asyncItv = setInterval(() => {
    //   this.checkIsEditorFocused()
    //   console.log('isEditorFocused', this.isEditorFocused)
    //   if(this.isEditorFocused) return
    //   this.asyncData()
    // }, 5000)
  },

  methods: {
    toggleMenu () {
      this.isMenuVisible = !this.isMenuVisible
    },

    closeMenu () {
      this.isMenuVisible = false
    },

    newNote () {
      // this.$hub.dispatchHub('newNote', this)
      this.$hub.dispatchHub('newTemplateDoc', this)
    },

    newFolder () {
      this.$hub.dispatchHub('newFolder', this)
    },

    handleMenuClick (value) {
      if (value === 'new_doc') {
        this.newNote()
      } else if (value === 'new_folder') {
        this.newFolder()
      }
    },

    asyncData () {
      this.pushData().catch(err => {
        this.$Message.error('同步失败，请重新登录')
        // clearInterval(asyncItv)
      })
    },

    checkIsEditorFocused () {
      this.$hub.dispatchHub('getIsFocused', this)
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
