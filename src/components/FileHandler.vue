<template>
  <div class="container"
    ref="container"
    v-if="currentFile"
    :style="{ width: containerWidth }">
    <div class="title ellipsis">
      {{ currentFile.title }}
    </div>
    <div class="handler">
      djojof
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FileHandler',

  data () {
    return {
      containerWidth: '0px'
    }
  },

  computed: {
    ...mapGetters({
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    viewType (val) {
      this.handleResize()
    }
  },

  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },

  methods: {
    handleResize () {
      this.$nextTick(() => {
        let space = this.viewType === 'expanded' ? 500 : 360
        this.containerWidth = document.body.clientWidth - space + 'px'
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  // width 100%
  height 60px !important
  position absolute
  top 40px
  // right 0
  display flex
  flex-direction row
  justify-content space-between
  align-items center
  border-bottom 1px solid #e6e6e6
  padding: 0 40px

.title
  font-size 18px
  color #333
  width 50%
</style>
