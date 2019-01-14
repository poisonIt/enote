<template>
  <div id="editor">
    <ckeditor
      :editor="editor"
      v-model="editorHtml"
      @ready="onEditorReady"
      @input="handleEditorInput"
      :config="editorConfig">
    </ckeditor>
  </div>
</template>

<script>
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
// import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'
import '@ckeditor/ckeditor5-build-classic/build/translations/zh-cn'
import '../assets/styles/editor.css'

export default {
  name: 'EditorComp',

  components: {
  },

  data () {
    return {
      editorInstance: null,
      editor: ClassicEditor,
      editorHtml: '<p>Content of the editor.</p>',
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

  methods: {
    onEditorReady (editor) {
      this.editorInstance = editor
      this.handleResize()
      window.onresize = () => {
        this.handleResize()
      }
      setInterval(() => {
        
      })
    },

    handleEditorInput () {
      console.log('handleEditorInput', this.editorInstance.getData())
    },

    saveData (data) {
      console.log('saveData')
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('Saved', data)
          resolve()
        }, 1000)
      })
    },

    handleResize () {
      document.getElementsByClassName('ck-content')[0].style.width = document.body.clientWidth - 500 + 'px'
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
