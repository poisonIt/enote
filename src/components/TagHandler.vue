<template>
  <div class="container"
    ref="container"
    :style="{ width: containerWidth }"
    v-if="isShowed">
    <div class="tag-list-button"
      @click="toggleList"
      ref="tagListButton">标签</div>
    <div class="tag-list"
      ref="tagList" 
      :style="{ maxWidth: tagListWidth }">
      <div class="tag-item"
        v-for="(item, index) in currentTags"
        :key="index">
        {{ item.name }}
        <span class="del-tag" @click="deleteTag(item)"></span>
      </div>
    </div>
    <div class="add-input" ref="addInput">
      <input
        type="text"
        v-model="addTagName"
        @blur="handleInputBlur"
        @keyup.enter="handleInputBlur"
        placeholder="输入后按回车键"
        ref="input">
    </div>
    <transition name="fade-in-down">
      <div class="all-tag-list-mask" v-if="isListShowed" @click.self="isListShowed = false">
        <div class="all-tag-list-container">
          <div class="title">选择标签</div>
          <ul class="all-tag-list">
            <li class="all-tag-list-item"
              v-for="(item, index) in allTags"
              :key="index">
                <div style="width: 100%;height: 100%;"
                  @click="toggleAllTagChecked(item)">
                  <input type="checkbox" v-model="item.checked">
                  {{ item.name }}
                </div>
            </li>
          </ul>
        </div>
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
      // allTags: [],
      // tags: [],
      currentTags: [],
      addTagName: '',
      isListShowed: false,
      containerWidth: '0px',
      tagListWidth: ''
    }
  },

  computed: {
    ...mapGetters({
      isShowed: 'GET_SHOW_TAG_HANDLER',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE',
      allTagsArr: 'GET_ALL_TAGS',
      allTagsMap: 'GET_TAGS_MAP'
    }),

    // tags () {
    //   console.log('111111', this.currentFile, this.tagsMap)
    //   return this.currentFile.tags.map(tagId => this.tagsMap[tagId].name)
    // }
  },

  watch: {
    showInput (val) {
      if (val) {
        this.$refs.input.select()
      }
    },

    currentFile: {
      handler: function (val) {
        if (val && val.tags) {
          console.log('tag- ', val.tags)
          this.currentTags = []
          val.tags.forEach(tagId => {
            let tag = this.allTagsMap[tagId]
            console.log('allTagsMap', this.allTagsMap)
            // if (!tag) {
            //   let idx = val.tags.indexOf(tagId)
            //   this.REMOVE_FILE_TAG({
            //     fileId: this.currentFile.id,
            //     tagId: tagId
            //   })
            // } else {
              this.currentTags.push(tag)
            // }
          })
        }
      },
      deep: true
    },

    allTagsMap (val) {
      if (this.currentFile && this.currentFile.tags) {
        this.currentTags = []
        this.currentFile.tags.forEach(tagId => {
          let tag = val[tagId]
          if (!tag) {
            this.REMOVE_FILE_TAG({
              fileId: this.currentFile.id,
              tagId: tagId
            })
          } else {
            this.currentTags.push(tag)
          }
        })
      }
    },

    allTagsArr (val) {
      console.log('watch-allTagsArr', val)
      this.allTags = []
      val.forEach(item => {
        let tag = {
          _id: item._id,
          name: item.name,
          file_ids: item.file_ids,
          remote_id: item.remote_id,
          checked: !!item.checked
        }
        this.allTags.push(tag)
      })
    }
  },

  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },

  methods: {
    ...mapActions([
      'SAVE_FILE_TITLE',
      'ADD_FILE_TAG',
      'REMOVE_FILE_TAG',
      'SET_TAGS_FROM_LOCAL'
    ]),

    handleResize () {
      this.$nextTick(() => {
        let space = this.viewType === 'expanded' ? 540 : 390
        let containerW = document.body.clientWidth - space
        this.containerWidth = containerW + 'px'
        if (this.$refs.tagListButton && this.$refs.addInput) {
          this.tagListWidth = containerW - 60 - 100 - 40 + 'px'
        }
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
        // this.updateCurrentFileTag()
      })
    },

    deleteTag (tag) {
      console.log('deleteTag', tag)
      this.REMOVE_FILE_TAG({
        fileId: this.currentFile.id,
        tagId: tag._id
      })
      this.currentTags.forEach(item => {
        item.checked = this.currentFile.tags.indexOf(item._id) > -1
      })
      // LocalDAO.tag.removeFile({
      //   fileId: this.currentFile.id,
      //   tagId: tag._id
      // }).then(() => {
      //   this.REMOVE_FILE_TAG({
      //     fileId: this.currentFile.id,
      //     tagName: tag._id
      //   }).then(() => {
      //     this.updateCurrentFileTag()
      //   })
      // })
    },

    updateCurrentFileTag () {
      // LocalDAO.tag.getByFileId(this.currentFile.id).then(res => {
      //   this.tags = res
      // })
      // this.SET_TAGS_FROM_LOCAL()
    },

    async toggleList () {
      this.isListShowed = !this.isListShowed
      // let allTags = await LocalDAO.tag.getAll()
      console.log('getTags', this.allTags)
      // this.allTags = res
      this.allTags.forEach(item => {
        item.checked = this.currentFile.tags.indexOf(item._id) > -1
      })
      // this.allTagsChecked = this.allTags.filter(item => item.checked).map(item => {
      //   return item._id
      // })
    },

    toggleAllTagChecked (tag) {
      console.log('toggleAllTagChecked', tag)
      if (!tag.checked) {
        this.ADD_FILE_TAG({
          id: this.currentFile.id,
          tag: tag.name
        })
        tag.checked = true
      } else {
        this.deleteTag(tag)
        tag.checked = false
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  // width 100%
  position relative
  height 36px !important
  border-bottom 1px solid #e6e6e6
  padding: 0 20px

.tag-list
  height 100%
  display flex
  align-items center
  float left
  overflow-x scroll
  padding 0 10px

.tag-list-button
  position relative
  float left
  width 60px
  height 100%
  // margin-right 24px
  font-size 12px
  line-height 20px
  display flex
  flex-direction row
  justify-content flex-start
  align-items center
  &::before
    content ''
    display inline-block
    vertical-align middle
    width 18px
    height 18px
    margin-top -2px
    margin-right 6px
    background-image url('../assets/images/lanhu/tag_grey@2x.png')
    background-size contain
    background-position center
    background-repeat no-repeat
  &::after
    content ''
    display block
    width 0
    height 0
    position absolute
    right 0
    top 50%
    transform translateY(-50%)
    border-left 3px solid transparent
    border-right 3px solid transparent
    border-top 4px solid #999

.tag-item
  position relative
  display inline-block
  height 21px
  margin-left 10px
  font-size 12px
  line-height 14px
  font-weight 600
  white-space nowrap
  background-color #ffefe8
  border-radius 16px
  padding 4px 16px
  color #F77231
  &:hover
    & .del-tag
      display block
  .del-tag
    display none
    position absolute
    right -4px
    top -4px
    width 13px
    height 13px
    text-align center
    background-image url('../assets/images/lanhu/close_round@2x.png')
    background-size contain
    background-position center
    background-repeat no-repeat

.add-input
  width 100px
  position relative
  float left
  padding-left 10px
  .placeholder
    position absolute
    top 50%
    left 0
    transform translateY(-50%)
    font-size 10px
    color #BAC0C6
  input
    width 100px
    height 20px
    margin-top 8px
    padding-left 10px
    outline none
    border-radius 4px
    border none
    box-sizing border-box
    &:focus
      border 1px solid #DDAF59
      padding-left 9px

.all-tag-list-mask
  position fixed
  top 0
  left 0
  width 100%
  height 100%
  background-color transparent
  z-index 9999
  -webkit-app-region drag
  
.all-tag-list-container
  width 200px
  position absolute
  // left -164px
  left 50%
  top 96px
  transform translateX(-50%)
  // border 1px solid #13ABC4
  border-radius 2px
  background-color #fff
  box-shadow 0 2px 13px 1px rgba(0,0,0,0.3)
  .title
    color #333
    font-size 12px
    line-height 36px
    font-weight 500
    padding-left 14px
    border-bottom 1px solid #E9E9E9
  .all-tag-list
    padding 6px 14px
    max-height 70vh
    overflow-y scroll
  .all-tag-list-item
    font-size 12px
    line-height 32px
    display flex
    align-items center
    input
      margin-right 10px

.input-checkbox
  position relative

.checkbox-empty
  border 1px solid #E9E9E9
  border-radius 2px
  background-color #fff
.checkbox-empty, .checkbox-checked
  position absolute
  left 0
  top 0
  vertical-align -2px
  width 12px
  height 12px
  margin-right 6px
.checkbox-checked
  background-image url('../assets/images/lanhu/checked@2x.png')
  background-size contain
  background-position center
  background-repeat no-repeat
</style>
