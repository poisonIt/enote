<template>
  <div
    class="b-select"
    :style="selectStyle"
    @click="toggleMenu"
    v-clickoutside="handleClose">
    <input
      class="b-select__inner"
      :class="[{ active : visible, disabled: disabled }]"
      type="text"
      v-model="selectedLabel"
      :placeholder="placeholder"
      readonly="readonly">
    <i class="fa fa-angle-down icon-arrow" :class="{'up' : visible}" aria-hidden="true"></i>
    <transition name="dropdown">
      <b-select-dropdown v-show="visible">
        <slot></slot>
      </b-select-dropdown>
    </transition>
  </div>
</template>

<script>
import Clickoutside from '@/utils/clickoutside'
import BSelectDropdown from './SelectDropdown'
import Emitter from '@/utils/mixins/emitter'

export default {
  name: 'BSelect',
  mixins: [ Emitter ],
  components: {
    BSelectDropdown
  },
  directives: { Clickoutside },
  data () {
    return {
      visible: false,
      selectedLabel: ''
    }
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    width: {
      type: String,
      default: '100px'
    },
    height: {
      type: String,
      default: '30px'
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    selectStyle () {
      return {
        width: this.width,
        height: this.height
      }
    }
  },

  created () {
    this.$on('option-click', this.handleOptionSelect)
  },

  // beforeDestroy () {
  //   this.$BUIEventHub.$off('handleOptionClick', this.handleOptionSelect)
  // },
  methods: {
    toggleMenu () {
      if (this.disabled) return
      this.visible = !this.visible
    },

    handleClose () {
      this.visible = false
    },

    handleOptionSelect ({ option, byClick }) {
      this.$emit('input', option.value)
      this.selectedLabel = option.label
      this.broadcast('b-option', 'select', option.value)
      this.handleClose()
    },

    clear () {
      this.selectedLabel = ''
      this.broadcast('b-option', 'select', null)
    }
  }
}
</script>

<style lang="stylus" scoped>
.b-select
  // flex 1
  position relative
  display flex
  flex-direction row
  align-items center
  .icon-arrow
    position absolute
    right 10px
    color #4A4A4A
    pointer-events none
    transition transform 0.2s ease
    &.up
      transform rotate(-180deg)
.b-select__inner
  width 100%
  height 100%
  background-color #fff
  border 1px solid #E9E9E9
  border-radius 4px
  vertical-align middle
  padding-left 10px
  cursor pointer
  color #333
  &:hover
    border-color #DDAF59
  &.active
    border-color #DDAF59
  &::placeholder
    // color #999
    color #333
  &.disabled
    &::placeholder
      color #eee
</style>
