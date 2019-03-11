<template>
  <div class="container"
    ref="container"
    v-if="isShowed">
    <div class="tag-list-button"
      @click="isListShowed = !isListShowed">标签</div>
    <div class="tag-item"
      v-for="(item, index) in tags"
      :key="index">
      {{ item.name }}
      <span class="del-tag" @click="deleteTag(item)">x</span>
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
    <transition name="dropdown">
      <div class="tag-list-container" v-show="isListShowed">
        <div class="title">选择标签</div>
        <ul class="tag-list">
          <li class="tag-list-item"
            v-for="(item, index) in tags"
            :key="index">
            <input type="checkbox">
            {{ item.name }}
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import LocalDAO from '../../db/api'

export default {
  name: 'TagHandler',

  data () {
    return {
      tags: [],
      addTagName: '',
      isListShowed: false
    }
  },

  computed: {
    ...mapGetters({
      isShowed: 'GET_SHOW_TAG_HANDLER',
      currentFile: 'GET_CURRENT_FILE',
      // tags: 'GET_CURRENT_FILE_TAGS',
      // tagsMap: 'GET_ALL_TAGS_MAP'
    }),

    // tags () {
    //   console.log('111111', this.currentFile, this.tagsMap)
    //   return this.currentFile.tags.map(tagId => this.tagsMap[tagId].name)
    // }
  },

  watch: {
    showInput (val) {
      if (val) {
        console.log(this.$refs.input)
        this.$refs.input.select()
      }
    },

    currentFile (val) {
      if (val) {
        console.log('1111', val, this.tagsMap)
        LocalDAO.tag.getAll().then(res => {
          console.log('getAllTags', res)
        })
        LocalDAO.tag.getByFileId(val.id).then(res => {
          console.log('getTags', res)
          this.tags = res
        })
      }
    }

    // tags (val) {
    //   console.log('watch-tags', val)
    // }
  },

  created () {
  },

  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },

  methods: {
    ...mapActions(['SAVE_FILE_TITLE', 'ADD_FILE_TAG', 'SET_TAGS_FROM_LOCAL']),

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
      this.ADD_FILE_TAG({
        id: this.currentFile.id,
        tag: this.addTagName
      }).then(() => {
        this.addTagName = ''
        LocalDAO.tag.getByFileId(this.currentFile.id).then(res => {
          this.tags = res.sort((a, b) => {
            return a.create_at.getTime() - b.create_at.getTime()
          })
        })
        this.SET_TAGS_FROM_LOCAL()
      })
    },

    deleteTag (tag) {
      console.log('deleteTag', tag)
      LocalDAO.tag.removeFile({
        fileId: this.currentFile.id,
        name: tag.name
      }).then(() => {
        LocalDAO.tag.getByFileId(this.currentFile.id).then(res => {
          this.tags = res.sort((a, b) => {
            return a.create_at.getTime() - b.create_at.getTime()
          })
        })
        this.SET_TAGS_FROM_LOCAL()
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  // width 100%
  position relative
  height 40px !important
  display flex
  flex-direction row
  justify-content flex-start
  align-items center
  border-bottom 1px solid #e6e6e6
  padding: 0 20px

.tag-list-button
  position relative
  margin-right 16px
  font-size 12px
  &::after
    content ''
    display block
    width 0
    height 0
    position absolute
    right -8px
    top 50%
    transform translateY(-50%)
    border-left 3px solid transparent
    border-right 3px solid transparent
    border-top 4px solid #333
  
.tag-list-container
  width 200px
  position absolute
  left -140px
  top 30px
  border 1px solid #13ABC4
  border-radius 2px
  background-color #fff
  box-shadow 0 2px 13px 1px rgba(0,0,0,0.3)
  z-index 9999
  .title
    font-size 12px
    line-height 36px
    font-weight 500
    padding-left 14px
    border-bottom 1px solid #979797
  .tag-list
    padding 6px 14px
  .tag-list-item
    font-size 12px
    line-height 32px
    input
      margin-right 10px

.tag-item
  position relative
  height 21px
  margin-right 10px
  font-size 10px
  font-weight 600
  white-space nowrap
  background-color #7EFAFF
  border-radius 4px
  padding 4px 16px
  &:hover
    & .del-tag
      display block
  .del-tag
    display none
    position absolute
    right 2px
    top 50%
    transform translateY(-50%)
    width 10px
    height 10px
    border-radius 50%
    color #fff
    font-size 10px
    line-height 9px
    padding-left 1px
    text-align center
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
