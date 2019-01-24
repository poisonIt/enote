<template>
  <transition name="fade">
    <div class="menu"
      v-show="visible"
      :style="{ width: width + 'px', top: top + 'px' }">
      <div class="menu_wrapper" v-if="visible" @click.self="handleClose"></div>
      <ul class="item-list">
        <li class="item"
          :class="{ separator : item.type === 'separator' }"
          :style="itemStyle"
          v-for="(item, index) in data"
          :key="index"
          @click.capture="handleItemClick(item, index)">
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script>
import popup from '@/utils/mixins/popup'

export default {
  name: 'Menu',

  mixins: [ popup ],

  props: {
    width: {
      type: Number,
      default: 174
    },
    height: {
      type: Number,
      default: 40
    },
    top: {
      type: Number,
      default: 0
    },
    fontSize: {
      type: Number,
      default: 13
    },
    background: {
      type: String,
      default: '#fff'
    },
    data: {
      type: Array,
      default: () => {
        return []
      }
    }
  },

  computed: {
    itemStyle () {
      return {
        width: this.width + 'px',
        height: this.height + 'px',
        fontSize: this.fontSize + 'px',
        backgroundColor: this.background
      }
    }
  },

  methods : {
    handleClose () {
      this.$emit('close')
    },

    handleItemClick (item, index) {
      if (item.type === 'separator') return
      this.$emit('itemClick', item.value, item, index)
      this.handleClose()
    }
  }
}
</script>

<style lang="stylus" scoped>
.menu_wrapper
  position fixed
  top 0
  left 0
  right 0
  bottom 0
  background-color rgba(0, 0, 0, 0)
  z-index -1
.menu
  position relative
  margin 0 auto
  width auto
  height auto
  border-radius 3px
  overflow hidden
  box-shadow 0 2px 6px 2px rgba(0, 0, 0, 0.3)
  z-index 9999
  .item-list
    z-index 1
    .item
      padding-left 30px
      font-size 14px
      display flex
      align-items center
      transition background-color ease 0.1s
      &:hover
        background-color #dddee0 !important

.separator
  height 1px !important
  background-color #dddee0 !important
</style>

