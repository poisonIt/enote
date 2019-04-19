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
      this.handleClose()
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
  background-color rgba(0, 0, 0, 0.3)
  z-index 10001
.modal
  position relative
  // margin 10vh auto
  background-color #fff
  border-radius 4px
  box-shadow 0px 0px 13px 0px rgba(0,0,0,0.15)

.modal__header
  height 42px
  position relative
  display flex
  flex-direction row
  align-items center
  border-bottom 1px solid #E9E9E9
  background-color #fff
  border-radius 4px
.modal__title
  flex 1
  font-size 14px
  font-weight 500
  text-align left
  padding 0 30px
  color #333
.modal__body
  // padding 20px 30px 0
  background-color #fff
// .icon-close
//   position absolute
//   top 20px
//   right 20px
//   cursor pointer
.icon-close
  position absolute
  right 20px
  width 13px
  height 13px
  background-image url('../../../assets/images/close.png')
  background-size cover
  opacity .3
</style>
