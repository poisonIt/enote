<template>
  <div class="container">
    <div class="expanded" v-if="viewType === 'expanded'">
      <div class="item expand" @click="toggleMenu">
        <span>新建笔记</span>
      </div>
      <div class="item upload"></div>
    </div>
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

export default {
  name: 'FileTool',

  data () {
    return {
      isMenuVisible: false,
      menuData: [
        {
          label: '新建模版笔记',
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
      viewType: 'GET_VIEW_TYPE'
    })
  },

  methods: {
    toggleMenu () {
      this.isMenuVisible = !this.isMenuVisible
    },

    closeMenu () {
      this.isMenuVisible = false
    },

    handleMenuClick (value) {
      console.log('handleMenuClick', value)
      if (value === 'new_doc') {
        this.$hub.$emit('newDoc')
      }
      if (value === 'new_folder') {
        this.$hub.$emit('newFolder')
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  position relative
  width 100%
  height 60px
  border-bottom 1px solid #e6e6e6

.expanded
  width 100%
  height 100%
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  padding 0 20px

.expand
  width 135px
  height 36px
  display flex
  flex-direction row
  justify-content flex-start
  align-items center
  padding 10px
  border-radius 3px
  font-size 14px
  color #fff
  background-color #3161A3
  &::before
    content '+'
    display block
    font-size 20px
    font-weight 600
    margin-right 10px

.upload
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

.unexpanded
  width 36px
  height 36px
  position absolute
  top 50%
  left 50%
  transform translate(-50%, -50%)
  border-radius 4px
  font-size 26px
  color #fff
  text-align center
  line-height 36px
  background-color #3161A3
  box-shadow 0px 2px 12px 1px rgba(0, 0, 0, 0.3)
</style>
