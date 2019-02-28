<template>
  <div
    class="b-select"
    :style="selectStyle"
    @click="toggleMenu"
    v-clickoutside="handleClose">
    <input
      class="b-select__inner"
      :class="[{ 'active' : visible }]"
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
  watch: {
    value (val) {
      console.log('select-val', val)
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
      this.visible = !this.visible
    },
    handleClose () {
      this.visible = false
    },
    handleOptionSelect ({ option, byClick }) {
      console.log('option', option)
      this.$emit('input', option.value)
      this.selectedLabel = option.label
      this.broadcast('b-option', 'select', option.value)
      this.handleClose()
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
  border 1px solid #13ABC4
  border-radius 2px
  vertical-align middle
  padding-left 10px
  cursor pointer
  &:hover
    border-color #0b8194
  &.active
    border-color #0b8194
  &::placeholder
    color #b5b5b5
</style>
