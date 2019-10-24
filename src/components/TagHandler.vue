<template>
  <div :class="showHeader?'container top_tag': 'container'"
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
        <span class="del-tag" @click="removeTag(item)"></span>
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
                <div style="width: 100%;height: 100%;">
                  <div class="item-click-mask" @click="toggleAllTagChecked(item, $event)"></div>
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
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import LocalDAO from '../../db/api'
import fetchLocal from '../utils/fetchLocal';

export default {
  name: 'TagHandler',

  data () {
    return {
      allTags: [],
      isShowCached: false,
      currentFileIdCached: '',
      currentTags: [],
      addTagName: '',
      isListShowed: false,
      shouldUpdateTagNav: true,
      containerWidth: '0px',
      tagListWidth: '',
      showHeader: false
    }
  },

  computed: {
    ...mapGetters({
      isShowed: 'GET_SHOW_TAG_HANDLER',
      currentFile: 'GET_CURRENT_FILE',
      currentNav: 'GET_CURRENT_NAV',
      selectedTags: 'GET_SELECTED_TAGS',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    showInput (val) {
      if (val) {
        this.$refs.input.select()
      }
    },

    currentFile: {
      handler: function (newVal, oldVal) {
        if (!newVal && oldVal) {
          this.isShowCached = this.isShowed
          this.TOGGLE_SHOW_TAG_HANDLER(false)
        }
        if (newVal && !oldVal) {
          if (newVal._id !== this.currentFileIdCached) {
            this.TOGGLE_SHOW_TAG_HANDLER(false)
          } else {
            this.TOGGLE_SHOW_TAG_HANDLER(this.isShowCached)
          }
        }
        if (newVal && oldVal) {
          if (newVal._id !== this.currentFileIdCached) {
            this.TOGGLE_SHOW_TAG_HANDLER(false)
          }
        }
        if (newVal && newVal.tags && newVal._id) {
          this.currentFileIdCached = newVal._id
        }
      },
      deep: true
    },

    currentTags (val) {
      this.handleResize()
    },

    isShowed (val) {
      if (val) {
        this.handleResize(true)
        this.fetchAllTag()
      }
    },

    isListShowed (val) {
      if (!val) {
        // this.$hub.dispatchHub('refreshList', this)
      }
    },

    addTagName (newVal, oldVal) {
      let str = newVal
      let codeLen = 0
      let lastIdx
      for (let i = 0, len = newVal.length; i < len; i++) {
        if (newVal[i].match(/[^\x00-\xff]/)) {
          codeLen += 2
        } else {
          codeLen++
        }
        if (codeLen <= 20) {
          lastIdx = i + 1
        } else {
          break
        }
      }
      this.addTagName = this.addTagName.substr(0, lastIdx)
    }
  },

  mounted () {
    this.handleResize(true)
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },
  created() {
    if (this.$remote.app.appConf.platform !== 'darwin') {
      this.showHeader = true
    }
  },
  methods: {
    ...mapActions([
      'SAVE_FILE_TITLE',
      'ADD_FILE_TAG',
      'REMOVE_FILE_TAG',
      'SET_TAGS_FROM_LOCAL',
      'TOGGLE_SHOW_TAG_HANDLER'
    ]),

    handleResize (isFisrt) {
      this.$nextTick(() => {
        let space = this.viewType === 'expanded' ? 540 : 390
        let containerW = document.body.clientWidth - space
        this.containerWidth = containerW + 'px'
        if (this.$refs.tagListButton && this.$refs.addInput) {
          this.tagListWidth = containerW - 60 - 100 - 40 + 'px'
        }
        if (this.$refs.tagList && !isFisrt) {
          this.$refs.tagList.scrollLeft = 100 * this.currentTags.length
        }
      })
    },

    handleInputBlur () {
      if (this.addTagName === '') {
        return
      }
      if (_.findIndex(this.allTags, { name: this.addTagName }) > -1) {
        this.shouldUpdateTagNav = false
        this.$Message.error('标签已存在，请重新输入')
      } else {
        this.shouldUpdateTagNav = true
      }
      this.isListShowed = false
      // add tag
      fetchLocal('addLocalTag', {
        note_id: this.currentFile._id,
        name: this.addTagName
      }).then(res => {
        this.addTagName = ''
        let newTag = res
        this.fetchAllTag()
        if (this.shouldUpdateTagNav) {
          this.$hub.dispatchHub('addTagNode', this, newTag)
        }
        this.$hub.dispatchHub('pushData', this)
      })
    },

    fetchAllTag () {
      fetchLocal('getLocalNoteById', { id: this.currentFile._id }).then(note => {
        fetchLocal('getAllLocalTag').then(tags => {
          this.allTags = tags
          this.currentTags = this.allTags
            .filter(item => note.tags.indexOf(item._id) > -1)
          this.allTags.forEach(item => {
            item.checked = note.tags.indexOf(item._id) > -1
          })
        })
      })
    },

    removeTag (tag) {
      let tags = this.currentTags
      tags.splice(tags.indexOf(tag), 1)

      fetchLocal('updateLocalNote', {
        id: this.currentFile._id,
        tags: tags.map(item => item._id)
      }).then(res => {
        this.fetchAllTag()
        if (this.currentNav.type === 'select' || this.currentNav.type === 'tag') {
          this.$hub.dispatchHub('refreshList', this)
        }
        this.$hub.dispatchHub('pushData', this)
      })
    },

    async toggleList () {
      this.isListShowed = !this.isListShowed
    },

    toggleAllTagChecked (tag, $event) {
      let inputNode = $event.target.parentNode.childNodes[1]
      inputNode.click()
      fetchLocal('updateLocalNote', {
        id: this.currentFile._id,
        tags: this.allTags.filter(item => item.checked).map(item => item._id)
      }).then(res => {
        this.currentTags = this.allTags
          .filter(item => res.tags.indexOf(item._id) > -1)
        this.$hub.dispatchHub('pushData', this)
      })
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
  &.top_tag
    top 30px
.tag-list
  height 100%
  display flex
  align-items center
  float left
  overflow-x scroll
  padding 0 10px
  &::-webkit-scrollbar
    display none

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
    position relative
    font-size 12px
    line-height 32px
    display flex
    align-items center
    .item-click-mask
      width 100%
      height 100%
      position absolute
      z-index 1
    input
      margin-right 10px
      z-index 0

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
