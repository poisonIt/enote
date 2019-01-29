<template>
  <div class="file-card-group">
    <slot></slot>
  </div>
</template>

<script>
import Emitter from '@/utils/mixins/emitter'

export default {
  name: 'FileCardGroup',

  mixins: [Emitter],

  props: {
  },

  mounted () {
    this.$on('item-click', instance => {
      this.broadcast('FileCard', 'cancelSelect')
      this.$emit('handleSelect', instance.$vnode.key)
    })
    this.$on('item-title-click', instance => {
      this.$emit('titleClick', instance.$vnode.key)
    })
  },

  methods: {
    select (index) {
      this.broadcast('FileCard', 'cancelSelect')
      this.$nextTick(() => {
        this.broadcast('FileCard', 'select', index)
      })
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
