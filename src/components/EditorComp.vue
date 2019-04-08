<template>
  <div id="editor">
    <div id="editor-container"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import '../assets/styles/editor.css'

export default {
  name: 'EditorComp',

  data () {
    return {
      editor: null,
      writer: null
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
      console.log('content', val)
      this.editor.setData(val)
    },

    viewType (val) {
      this.handleResize()
    }
  },

  mounted () {
    this.editor = CKEDITOR.replace('editor-container', {
      uiColor: '#FFFFFF',
      toolbarGroups: [
        { name: 'undo', groups: [ 'undo', 'basicstyles', 'colors', 'cleanup', 'list', 'indent', 'blocks', 'links', 'insert', 'tools' ] },
        '/',
        { name:  'styles', groups: [ 'styles' ] }
      ],
      removeButtons: 'Source,NewPage,Preview,Print,Templates,Save,Cut,Copy,Paste,PasteText,PasteFromWord,SelectAll,Scayt,Replace,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Anchor,Unlink,Flash,HorizontalRule,Smiley,SpecialChar,PageBreak,Iframe,CopyFormatting'
    })
    this.editor.on('instanceReady', (ev) => {
      // ev.editor.fire('contentDom');
      this.onEditorReady()
    })
    this.editor.on('change', () => {
      console.log('change', this.editor.getData())
      this.SET_EDITOR_CONTENT_CACHE(this.editor.getData())
    })
    this.editor.on('dataReady', () => {
      console.log('dataReady', this.editor.getData())
      // this.editor.resetUndo()
    })
    this.editor.on('blur', () => {
      this.saveData()
      // this.editor.resetUndo()
    })
    console.log('ready', this.$remote.globalShortcut)
    // this.$remote.globalShortcut.register('CommandOrControl+A', () => {
    //   this.editor.setData('<p>aaa</p>')
    // })
    // const editorParser = new CKEDITOR.htmlParser()
    // console.log('editorParser-1111', editorParser.parse('<!-- Example --><b>Hello</b>'))
    // this.editor.on('blur', () => {
    //   console.log('blur')
    //   this.saveData()
    // })
  },

  methods: {
    ...mapActions(['SAVE_DOC', 'SET_EDITOR_CONTENT_CACHE']),

    onEditorReady () {
      console.log('editorReady')
      this.SET_EDITOR_CONTENT_CACHE(this.content)
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
    },

    saveData () {
      console.log('saveData')
      this.SAVE_DOC({
        id: this.currentFile.id,
        html: this.editor.getData()
      })
    },

    handleResize () {
      console.log('handleResize', this.viewType)
      // this.editor.setData(this.content)
      let space = this.viewType === 'expanded' ? 540 : 390
      let w = document.body.clientWidth - space
      let h = document.body.clientHeight - document.getElementById('cke_1_top').getBoundingClientRect().height - 100
      this.editor.resize(w, h, true)
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
