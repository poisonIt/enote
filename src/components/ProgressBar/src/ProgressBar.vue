<template>
  <div class="progress-bar">
    <div class="runway"
      :style="{
        width: this.width,
        height: this.height
      }">
      <div class="progress"
        :style="{
          width: progressWidth,
          height: '100%',
          left: '0%',
          backgroundColor: progressColor
        }"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgressBar',

  props: {
    width: {
      type: String,
      default: '400px'
    },

    height: {
      type: String,
      default: '30px'
    },

    value: {
      type: [Number, String],
      default: 0
    },

    progressColor: {
      type: String,
      default: '#3161A3'
    }
  },

  computed: {
    progressWidth () {
      return this.value + '%'
    }
  }
}
</script>

<style lang="stylus" scoped>
.runway
  margin 0 auto
  background-color #fff
  border 1px solid #13ABC4
</style>
