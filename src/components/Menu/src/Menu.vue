<template>
  <transition :name="transition">
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
import * as _ from 'lodash'

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
    },
    transition: {
      type: String,
      default: 'dropdown'
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

  watch: {
    data (val) {
      this.trdata = val
      this.initGroups()
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
      let valTemp
      let uid = 0
      function pushGroup (item) {
        group.items.push(item)
        item.groupId = uid
      }
      function addGroup (groups) {
        group.value = valTemp
        groups[uid] = group
        uid++
        group = {
          value: '',
          items: []
        }
      }
      for (let i = 0, len = this.trdata.length; i < len; i++) {
        let item = this.trdata[i]
        if (item.actived) {
          valTemp = item.value
        }
        let prevItem = this.trdata[i - 1]
        if (_.isUndefined(item.actived)) {
          item.actived = false
        }
        item.groupId = null
        item.type = item.type || 'default'
        if (item.type === 'separator') {
          if (group.items.length > 0) {
            addGroup(this.groups)
          }
          continue
        }
        if (group.items.length === 0) {
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
        // return type === 'down' ? !item.actived : item.actived
        return type === 'down' ? item.actived : !item.actived
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
        item.actived = true
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
  border-radius 2px
  overflow hidden
  box-shadow 0px 0px 6px 0px rgba(0,0,0,0.15)
  z-index 99999
  .item-list
    z-index 1
    .item
      position relative
      padding-left 30px
      font-size 14px
      display flex
      align-items center
      color #333
      transition background-color ease 0.1s
      &:hover
        background-color #FFF5E2 !important
        color #DDAF59
      &::after
        position absolute
        top 50%
        right 20px
        transform translateY(-50%)
        content ''
        display block
        width 16px
        height 16px
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
          width 13px
          height 13px
          background-image url(../../../assets/images/arrows_down.png)
.separator
  height 1px !important
  background-color #dddee0 !important
</style>
