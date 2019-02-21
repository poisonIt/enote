<template>
  <div class="container"
    ref="container">
    <div class="tag-list">标签</div>
    <div class="tag-item"
      v-for="(item, index) in tags"
      :key="index">
      {{ item }}
    </div>
    <div class="add-input">
      <input
        type="text"
        v-model="addTagName"
        @blur="handleInputBlur"
        @keyup.enter="handleInputBlur"
        placeholder="点此添加标签"
        ref="input">
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'TagHandler',

  data () {
    return {
      tags: ['标签一', '标签二', '标签三'],
      addTagName: ''
    }
  },

  computed: {
    ...mapGetters({
    })
  },

  watch: {
    showInput (val) {
      if (val) {
        console.log(this.$refs.input)
        this.$refs.input.select()
      }
    }
  },

  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },

  methods: {
    ...mapActions(['SAVE_FILE_TITLE']),

    handleResize () {
      this.$nextTick(() => {
        let space = this.viewType === 'expanded' ? 500 : 360
        this.containerWidth = document.body.clientWidth - space + 'px'
      })
    },

    handleInputBlur () {
      if (this.addTagName === '') {
        return
      }
      console.log('handleInputBlur', this.addTagName)
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  // width 100%
  height 40px !important
  display flex
  flex-direction row
  justify-content flex-start
  align-items center
  border-bottom 1px solid #e6e6e6
  padding: 0 20px

.tag-list
  margin-right 16px
  font-size 12px

.tag-item
  position relative
  margin-right 10px
  font-size 10px
  font-weight 600
  background-color #7EFAFF
  border-radius 4px
  padding 3px 16px
  font-size 10px
  &:hover
    &::after
      position absolute
      right 2px
      top 30%
      transform translateY(-50%)
      content 'X'
      display block
      width 12px
      height 12px
      border-radius 50%
      color #fff
      text-align center
      line-height 12px
      background-color grey

.add-input
  min-width 80px
  position relative
  .placeholder
    position absolute
    top 50%
    left 0
    transform translateY(-50%)
    font-size 10px
    color #9B9B9B
  input
    width 100px
    height 20px
    padding-left 10px
    outline-color #003884
    border none
</style>
