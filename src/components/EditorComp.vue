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
import { mapGetters } from 'vuex'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
// import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'
import '@ckeditor/ckeditor5-build-classic/build/translations/zh-cn'
import '../assets/styles/editor.css'
import { writeFile } from '@/utils/file'

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

  computed: {
    ...mapGetters({
      content: 'GET_EDITOR_CONTENT',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    content (val) {
      console.log('watch-content', val)
      this.editorHtml = val
    },

    viewType (val) {
      this.handleResize()
    }
  },

  methods: {
    onEditorReady (editor) {
      this.editorInstance = editor
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
      this.$hub.$on('saveEditorContent', () => {
        // console.log('saveEditorContent', this.editorHtml)
        const appPath = '/Users/bowiego/Documents/workspace/enote/public'

        writeFile(`${appPath}/docs/${this.currentFile.id}.xml`, this.editorHtml).then(data => {
          // console.log('writeFile-res', data)
        }).catch(err => {
          alert(err)
        })
      })
    },

    handleEditorInput () {
      // console.log('handleEditorInput', this.editorInstance.getData())
    },

    saveData (data) {
      // console.log('saveData')
      return new Promise(resolve => {
        setTimeout(() => {
          // console.log('Saved', data)
          resolve()
        }, 1000)
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
