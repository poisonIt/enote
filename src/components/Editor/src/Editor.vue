<template>
  <div id="editor-container">
    <textarea name="content" ref="editor" id="editor" @blur="() => {console.log('blur')}"></textarea>
    <div class="mask" v-show="showMask"></div>
    <!-- <ckeditor
      :editor="editor"
      v-model="editorHtml"
      @ready="onEditorReady"
      @input="handleEditorInput"
      @blur="saveData"
      :config="editorConfig">
    </ckeditor> -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import uploadAdapter from './upload'
// import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'
import '@ckeditor/ckeditor5-build-classic/build/translations/zh-cn'
import '../../../assets/styles/editor.css'

export default {
  name: 'EditorComp',

  data () {
    return {
      showMask: true,
      editor: null,
      editorInstance: null,
      editor: ClassicEditor,
      editorHtml: '<p></p>',
      editorConfig: {
        // toolbar: [ 'undo', 'redo', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'highlight:yellowMarker' ],
        language: 'zh-cn'
        // plugins: [
        //   Autosave
        // ],
        // autosave: {
        //   save (editor) {
        //     console.log(Array.from( editor.ui.componentFactory.names()))
        //     console.log('autosave', editor.getData())
        //     // return editor.getData()
        //     // The saveData() function must return a promise
        //     // which should be resolved when the data is successfully saved.
        //     return saveData(editor.getData())
        //   }
        // },
      }
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
      console.log('watch-currentFile', val)
      if (oldVal && oldVal.type === 'doc' && this.editor.getData) {
        let editorData = this.editor.getData()
        if (this.editor.getData() !== this.contentCache) {
          this.EDIT_DOC({
          id: oldVal.id,
          content: this.editor.getData()
        })
        }
      }
      if (val && val.type === 'doc') {
        this.showMask = true
        setTimeout(() => {
          this.initEditor()
        }, 300)
      }
    },

    content (val) {
      this.editorHtml = val
    },

    viewType (val) {
      this.handleResize()
    }
  },

  mounted () {
    // this.initEditor()
  },

  methods: {
    ...mapActions([
      'SAVE_DOC',
      'EDIT_DOC',
      'SET_EDITOR_CONTENT_CACHE',
      'EDIT_FILE'
    ]),

    initEditor () {
      if (this.editor.destroy) {
        this.editor.destroy()
        this.editor = null
      }
      ClassicEditor
        .create(this.$refs.editor, {
          language: 'zh-cn',
          // toolbar: [ 'undo', 'redo', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'highlight:yellowMarker', 'Image' ],
          extraPlugins: [ uploadAdapter ]
        })
        .then(editor => {
          this.editor = editor
          console.log('instances', this.editor.destroy)
          console.log('editor', this.editor, this.currentFile)
          this.editor.setData(this.currentFile.content || '')
          this.editor.model.document.on('change:data', () => {
            console.log('change')
          })
          this.editor.on('blur', () => {
            console.log('blur')
          })
          this.SET_EDITOR_CONTENT_CACHE(this.currentFile.content)
          this.showMask = false
        })
        .catch(error => {
          console.error(error)
        })
    },

    onEditorReady (editor) {
      this.editorInstance = editor
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
    },

    handleEditorInput () {
      // console.log('handleEditorInput', this.editorInstance.getData())
    },

    saveData () {
      console.log('saveData')
      this.SAVE_DOC({
        id: this.currentFile.id,
        html: this.editorHtml
      })
    },

    handleResize () {
      console.log('handleResize')
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
  z-index 99999
</style>
