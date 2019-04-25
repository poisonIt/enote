<template>
  <div id="editor-container">
    <textarea name="content" ref="editor" id="editor"></textarea>
    <div class="mask" v-show="showMask"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import uploadAdapter from './upload'
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'
import '@ckeditor/ckeditor5-build-classic/build/translations/zh-cn'
import '../../../assets/styles/editor.css'

export default {
  name: 'EditorComp',

  mixins: mixins,

  data () {
    return {
      cachedDoc: {
        id: '',
        content: ''
      },
      showMask: true,
      editor: null,
    }
  },

  computed: {
    ...mapGetters({
      contentCache: 'GET_EDITOR_CONTENT_CACHE',
      content: 'GET_EDITOR_CONTENT',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    currentFile (val, oldVal) {
      if (!val) {
        this.showMask = true
        return
      }
      if (val && val.type === 'doc') {
        this.showMask = true
        setTimeout(() => {
          this.initEditor()
        }, 100)
      }
    },

    content (val) {
      this.editorHtml = val
    },

    viewType (val) {
      this.handleResize()
    }
  },

  methods: {
    ...mapActions([
      'SAVE_DOC',
      'EDIT_DOC',
      'SET_EDITOR_CONTENT_CACHE',
      'SET_CACHED_DOC',
      'EDIT_FILE',
      'SET_IS_EDITOR_FOCUSED'
    ]),

    initEditor () {
      const _self = this
      if (this.editor) {
        this.editor.setData(this.currentFile.content || '')
        this.cachedDoc = {
          id: this.currentFile.id,
          content: this.currentFile.content
        }
        this.showMask = false
      } else {
        ClassicEditor
          .create(this.$refs.editor, {
            language: 'zh-cn',
            // toolbar: [ 'undo', 'redo', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'highlight:yellowMarker', 'Image' ],
            extraPlugins: [ uploadAdapter, Autosave ],
            autosave: {
              save (editor) {
                let editorData = editor.getData()
                if (editorData !== _self.cachedDoc.content) {
                  if (_self.currentFile === _self.cachedDoc.id) {
                    _self.EDIT_DOC({
                      id: _self.cachedDoc.id,
                      content: editorData
                    })
                    _self.cachedDoc.content = editorData
                  } else {
                    _self.EDIT_DOC({
                      id: _self.cachedDoc.id,
                      content: editorData
                    })
                    _self.cachedDoc.content = editorData
                  }
                }
              }
            },
          })
          .then(editor => {
            console.log('editor', editor, editor.ui.view.editable.isFocused)
            this.editor = editor
            this.editor.setData(this.currentFile.content || '')
            this.cachedDoc = {
              id: this.currentFile.id,
              content: this.currentFile.content
            }
            this.showMask = false
            this.editor.ui.focusTracker.on('focus', () => {
              console.log('focus')
            })
            // setInterval(() => {
            //   console.log('isFocused', this.editor.ui.view.editable.isFocused)
            // })
            // this.editor.ui.view.editable
          })
          .catch(error => {
            console.error(error)
          })
      }
    },

    onEditorReady (editor) {
      this.editorInstance = editor
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
    },

    handleResize () {
      let space = this.viewType === 'expanded' ? 500 : 360
      document.getElementsByClassName('ck-content')[0].style.width = document.body.clientWidth - space + 'px'
    }
  }
}
</script>

<style lang="stylus" scoped>
#editor-container
  position relative
.mask
  position absolute
  width 100%
  height 100%
  top 0
  left 0
  background-color #fff
  z-index 9999
</style>
