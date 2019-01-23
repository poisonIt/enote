export default {
  props: {
    visible: Boolean,
    transitionName: {
      type: String,
      default: 'fade-in-down'
    }
  },

  data () {
    return {
      isHide: true
    }
  },

  watch: {
    visible (val) {
      if (val) {
        this.isHide = false
      } else {
        setTimeout(() => {
          this.isHide = true
        }, 300)
      }
    }
  }
}
