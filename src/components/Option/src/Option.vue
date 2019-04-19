<template>
  <li
    class="b-select-dropdown__item"
    :class="{ right: children.length > 0 }"
    @click.stop="handleClick"
    @mouseover="handleMouseover"
    @mouseout="handleMouseout">
    <i class="fa fa-check icon-check" aria-hidden="true" v-show="selected"></i>
    <slot>
      <span>{{ label }}</span>
    </slot>
    <div class="child" v-if="children.length > 0 && showChildren">
      <b-option
        v-for="(item, index) in children"
        :key="index"
        :label="item[labelProxy]"
        :value="item[valueProxy]"
        :labelProxy="labelProxy"
        :valueProxy="valueProxy"
        :children="item.children">
      </b-option>
    </div>
  </li>
</template>

<script>
import Emitter from '@/utils/mixins/emitter'

export default {
  name: 'BOption',
  mixins: [ Emitter ],
  data () {
    return {
      showChildren: false,
      selected: false
    }
  },
  props: {
    value: {
      required: true
    },
    valueProxy: {
      type: String,
      default: 'value'
    },
    label: {
      type: String,
      default: '选项'
    },
    labelProxy: {
      type: String,
      default: 'label'
    },
    children: {
      type: Array,
      default () {
        return []
      }
    }
  },

  created () {
    this.$on('select', (value) => {
      this.selected = (this.value === value)
    })
  },

  methods: {
    handleClick () {
      this.dispatch('BSelect', 'option-click', { option: this, byClick: true })
    },
    handleMouseover () {
      this.showChildren = true
    },
    handleMouseout () {
      this.showChildren = false
    }
  }
}
</script>

<style lang="stylus" scoped>
.b-select-dropdown__item
  position relative
  height 30px
  padding 0 20px 0 30px
  line-height 30px
  font-size 13px
  white-space nowrap
  // overflow hidden
  text-overflow ellipsis
  color #606266
  cursor pointer
  text-align left
  &:hover
    background-color #f5f7fa
.child
  position absolute
  top -2px
  left 100%
  background-color #fff
  border 2px solid #e4e7ed
  box-shadow 0 2px 12px 0 rgba(0,0,0,.1)
.right
  font-family FontAwesome
  &::after
    content "\F105"
    color #b5b5b5
    position absolute
    right 8px
.icon-check
  font-size 10px
  position absolute
  top 50%
  left 7%
  transform translateY(-50%)
</style>
