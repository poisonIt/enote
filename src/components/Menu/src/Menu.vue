<template>
  <transition name="fade">
    <div class="menu"
      v-show="visible"
      :style="{ width: width + 'px', top: top + 'px' }">
      <div class="menu_wrapper" v-if="visible" @click.self="handleClose"></div>
      <ul class="item-list">
        <li class="item"
          :class="{
            separator : item.type === 'separator',
            selected : isSelected(item),
            sortDown : itemSortType(item, 'down') && isSelected(item),
            sortUp : itemSortType(item, 'up') && isSelected(item)
          }"
          :style="itemStyle"
          v-for="(item, index) in trdata"
          :key="index"
          @click.capture="handleItemClick(item, index)">
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script>
import mixins from '../mixins'

export default {
  name: 'Menu',

  mixins: mixins,

  data () {
    return {
      trdata: [],
      groups: []
    }
  },

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

  created () {
    this.trdata = this.data
    this.initGroups()
  },

  methods: {
    initGroups () {
      this.groups = {}
      let group = {
        value: '',
        items: []
      }
      let uid = 0
      function pushGroup (item) {
        group.items.push(item)
        item.groupId = uid
      }
      function addGroup (groups) {
        groups[uid] = group
        uid++
        group = {
          value: '',
          items: []
        }
      }
      for (let i = 0, len = this.trdata.length; i < len; i++) {
        let item = this.trdata[i]
        let prevItem = this.trdata[i - 1]
        item.actived = false
        item.groupId = null
        item.type = item.type || 'default'
        if (item.type === 'separator') {
          if (group.items.length > 0) {
            addGroup(this.groups)
          }
          continue
        }
        if (group.items.length === 0) {
          group.value = item.value
          pushGroup(item)
        } else {
          if (prevItem && prevItem.type === item.type && i !== len - 1) {
            pushGroup(item)
          } else {
            if (i === len - 1) {
              pushGroup(item)
            }
            addGroup(this.groups)
          }
        }
      }
    },

    getGroupValue (item) {
      if (item.groupId !== null) {
        return this.groups[item.groupId].value
      }
      return false
    },

    isSelected (item) {
      return item.value === this.getGroupValue(item) && item.type !== 'default'
    },

    itemSortType (item, type) {
      if (item.type === 'sort') {
        return type === 'down' ? !item.actived : item.actived
      } else {
        return false
      }
    },

    handleClose () {
      this.$emit('close')
    },

    handleItemClick (item, index) {
      if (item.type === 'separator') return
      let group = this.groups[item.groupId]
      if (group.value === item.value) {
        item.actived = !item.actived
      } else {
        group.value = item.value
        group.items.forEach(item => {
          item.actived = false
        })
      }
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
      position relative
      padding-left 30px
      font-size 14px
      display flex
      align-items center
      transition background-color ease 0.1s
      &:hover
        background-color #dddee0 !important
      &::after
        position absolute
        top 50%
        right 20px
        transform translateY(-50%)
        content ''
        display block
        width 18px
        height 18px
        background-repeat no-repeat
        background-size contain
        background-position center
      &.selected
        &::after
          background-image url(../../../assets/images/check.png)
      &.sortUp
        &::after
          top 30%
          width 16px
          height 16px
          background-image url(../../../assets/images/arrows_down.png)
          transform rotate(180deg)
      &.sortDown
        &::after
          width 16px
          height 16px
          background-image url(../../../assets/images/arrows_down.png)
.separator
  height 1px !important
  background-color #dddee0 !important
</style>
