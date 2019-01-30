<template>
  <div id="editor">
    <ckeditor
      :editor="editor"
      v-model="editorHtml"
      @ready="onEditorReady"
      @input="handleEditorInput"
      @blur="saveData"
      :config="editorConfig">
    </ckeditor>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
// import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'
import '@ckeditor/ckeditor5-build-classic/build/translations/zh-cn'
import '../assets/styles/editor.css'
import EventHub from '@/utils/mixins/eventhub'

export default {
  name: 'EditorComp',

  mixins: [EventHub],

  data () {
    return {
      editorInstance: null,
      editor: ClassicEditor,
      editorHtml: '<p></p>',
      editorConfig: {
        toolbar: [ 'undo', 'redo', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote' ],
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
      content: 'GET_EDITOR_CONTENT',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    content (val) {
      this.editorHtml = val
    },

    viewType (val) {
      this.handleResize()
    }
  },

  methods: {
    ...mapActions(['SAVE_DOC']),

    onEditorReady (editor) {
      this.editorInstance = editor
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
      // this.hookHub('saveEditorContent', 'DocumentList', () => {
      //   this.SAVE_DOC({
      //     id: this.currentFile.id,
      //     html: this.editorHtml
      //   })
      // })
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
      let space = this.viewType === 'expanded' ? 500 : 360
      document.getElementsByClassName('ck-content')[0].style.width = document.body.clientWidth - space + 'px'
    }
  }
}
</script>

<style lang="stylus" scoped>
#editor
  // margin-top 40px
</style>
