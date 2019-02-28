<template>
  <transition name="fade">
    <div class="popup__wrapper"
      v-show="!isHide"
      @click.self="handleWrapperClick">
      <transition v-bind:name="transitionName">
        <div class="modal"
          v-show="visible"
          :style="modalStyle">
          <div class="modal__header">
            <div class="icon-close" @click="handleClose"></div>
            <!-- <i class="fa fa-times icon-close"
              aria-hidden="true"
              v-if="showClose"
              @click="handleClose">
            </i> -->
            <slot name="title">
              <span class="modal__title">{{ title }}</span>
            </slot>
          </div>
          <div class="modal__body">
            <slot></slot>
          </div>
          <div class="modal__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import mixins from '../mixins'

export default {
  name: 'Modal',

  mixins: mixins,

  props: {
    title: String,
    showClose: {
      type: Boolean,
      default: true
    },
    width: {
      type: String,
      default: '50%'
    },
    height: {
      type: String,
      default: 'auto'
    },
    top: {
      type: String,
      default: '10vh'
    }
  },

  computed: {
    modalStyle () {
      return {
        width: this.width,
        height: this.height,
        margin: this.top + ' auto'
      }
    }
  },

  methods: {
    handleClose () {
      // this.$emit('update:visible', false)
      this.$emit('close')
    },
    handleWrapperClick () {
      // return
      // this.handleClose()
    }
  }
}
</script>

<style lang="stylus" scoped>
.popup__wrapper
  position fixed
  top 0
  left 0
  right 0
  bottom 0
  background-color rgba(0, 0, 0, 0)
  z-index 10001
.modal
  position relative
  // margin 10vh auto
  background-color #f5f5f5
  box-shadow 0px 3px 10px 1px rgba(0, 0, 0, 0.3)

.modal__header
  height 40px
  position relative
  display flex
  flex-direction row
  align-items center
  border-bottom 1px solid #c5c5c5
  background linear-gradient(#eff0f1, #dddee0)
.modal__title
  flex 1
  font-size 14px
  text-align center
.modal__body
  padding 20px 30px 0
// .icon-close
//   position absolute
//   top 20px
//   right 20px
//   cursor pointer
.icon-close
  position absolute
  left 10px
  width 13px
  height 13px
  background-image url('../../../assets/images/close.png')
  background-size cover
</style>
