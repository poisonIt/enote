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

export default {
  name: 'TagHandler',

  data () {
    return {
      allTags: [],
      // tags: [],
      currentTags: [],
      currentTagIds: [],
      currentFileCopy: {
        _id: null,
        tags: []
      },
      addTagName: '',
      isListShowed: false,
      shouldUpdateTagNav: true,
      containerWidth: '0px',
      tagListWidth: ''
    }
  },

  computed: {
    ...mapGetters({
      isShowed: 'GET_SHOW_TAG_HANDLER',
      currentFile: 'GET_CURRENT_FILE',
      currentNav: 'GET_CURRENT_NAV',
      selectedTags: 'GET_SELECTED_TAGS',
      viewType: 'GET_VIEW_TYPE'
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
        if (!val || val._id !== this.currentFileIdCached) {
          this.TOGGLE_SHOW_TAG_HANDLER(false)
        }
        if (val && val.tags) {
          this.currentTags = []
          this.currentFileCopy = {
            _id: val._id,
            tags: [...val.tags]
          }
          this.currentTags = this.allTags
            .filter(item => this.currentFile.tags.indexOf(item._id) > -1)
          // console.log('tag- ', val.tags)
          // this.currentTags = []
          // val.tags.forEach(tagId => {
          //   let tag = this.allTagsMap[tagId]
          //   console.log('allTagsMap', this.allTagsMap)
          //   // if (!tag) {
          //   //   let idx = val.tags.indexOf(tagId)
          //   //   this.REMOVE_FILE_TAG({
          //   //     fileId: this.currentFile.id,
          //   //     tagId: tagId
          //   //   })
          //   // } else {
          //     this.currentTags.push(tag)
          //   // }
          // })
          this.currentFileIdCached = val._id
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
      // if (val) {
      //   ipcRenderer.send('fetch-local-data', {
      //     tasks: ['getAllLocalTag'],
      //     from: 'TagHandler',
      //   })
      // }
    }
  },

  created () {
    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from === 'TagHandler') {
        if (arg.tasks[0] === 'getAllLocalTag') {
          this.allTags = arg.res[0]
          this.allTags.forEach(item => {
            item.checked = this.currentFileCopy.tags.indexOf(item._id) > -1
          })
          ipcRenderer.send('fetch-local-data', {
            tasks: ['getLocalNoteById'],
            params: [{ id: this.currentFile._id }],
            from: 'TagHandler',
          })
        }
        if (arg.tasks[0] === 'getLocalNoteById') {
          this.currentTags = this.allTags
            .filter(item => arg.res[0].tags.indexOf(item._id) > -1)
        }
      }
      if (arg.from[0] === 'TagHandler') {
        if (arg.from[1] === 'toggleTagChecked') {
          console.log('toggleTagChecked-res', arg.res)
          this.currentTags = this.allTags
            .filter(item => arg.res[0].tags.indexOf(item._id) > -1)
          this.currentFileCopy.tags = this.currentTags.map(item => item._id)
        }
        if (arg.from[1] === 'addTag') {
          console.log('addTag-res', arg.res)
          this.addTagName = ''
          let newTag = arg.res[0]
          console.log('currentFileCopy', this.currentFileCopy)
          this.currentFileCopy.tags.push(newTag._id)
          this.fetchAllTag()
          if (this.shouldUpdateTagNav) {
            this.$hub.dispatchHub('addTagNode', this, newTag)
          }
        }
        if (arg.from[1] === 'removeTag') {
          console.log('removeTag-res', arg.res)
          let newNote = arg.res[0]
          this.currentFileCopy.tags = [...newNote.tags]
          this.fetchAllTag()
          if (this.currentNav.type === 'select' || this.currentNav.type === 'tag') {
            ipcRenderer.send('fetch-local-data', {
              tasks: ['getLocalTagNote'],
              params: [{ tags: this.selectedTags }],
              from: 'DocumentList',
            })
          }
        }
      }
    })
  },

  mounted () {
    this.handleResize(true)
    this.$hub.pool.push(() => {
      this.handleResize()
    })
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
      } else {
        this.shouldUpdateTagNav = true
      }
      this.isListShowed = false
      console.log('handleInputBlur', this.addTagName)
      // add tag
      ipcRenderer.send('fetch-local-data', {
        tasks: ['addLocalTag'],
        params: [{
          note_ids: [this.currentFile._id],
          name: this.addTagName
        }],
        from: ['TagHandler', 'addTag']
      })

      // this.ADD_FILE_TAG({
      //   id: this.currentFile.id,
      //   tag: this.addTagName
      // }).then(() => {
      //   this.addTagName = ''
      //   // this.updateCurrentFileTag()
      // })
    },

    fetchAllTag () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalTag'],
        from: 'TagHandler',
      })
    },

    removeTag (tag) {
      let tags = [...this.currentFileCopy.tags]
      console.log('removeTag-0000', tag, tags)
      tags.splice(tags.indexOf(tag._id), 1)
      console.log('remoteTag-1111', tags)

      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalNote'],
        params: [{
          id: this.currentFile._id,
          tags: tags
        }],
        from: ['TagHandler', 'removeTag'],
      })
      // this.REMOVE_FILE_TAG({
      //   fileId: this.currentFile.id,
      //   tagId: tag._id
      // })
      // this.currentTags.forEach(item => {
      //   item.checked = this.currentFileCopy.tags.indexOf(item._id) > -1
      // })
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
      
      // this.allTagsChecked = this.allTags.filter(item => item.checked).map(item => {
      //   return item._id
      // })
    },

    toggleAllTagChecked (tag, $event) {
      let inputNode = $event.target.parentNode.childNodes[1]
      inputNode.click()
      // if ($event.target.localName !== 'input') {
        // $event.target.firstChild.click()
        // tag.checked = !tag.checked
      // }
      console.log('toggleAllTagChecked', $event, tag, this.allTags)
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalNote'],
        params: [{
          id: this.currentFile._id,
          tags: this.allTags.filter(item => item.checked).map(item => item._id)
        }],
        from: ['TagHandler', 'toggleTagChecked']
      })
      // if (!tag.checked) {
      //   ipcRenderer.send('fetch-local-data', {
      //     tasks: ['updateLocalNote'],
      //     params: [{
      //       id: this.currentFile._id,
      //       tags: true
      //     }],
      //     from: ['DocumentList', 'stickTop', this.popupedFile.file_id]
      //   })
      //   // this.ADD_FILE_TAG({
      //   //   id: this.currentFile.id,
      //   //   tag: tag.name
      //   // })
      //   tag.checked = true
      // } else {
      //   this.removeTag(tag)
      //   tag.checked = false
      // }
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
