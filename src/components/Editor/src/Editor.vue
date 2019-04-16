<template>
  <div id="editor" ref="container">
    <div id="editor-container"></div>
    <div class="mask" v-show="showMask"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import '@/assets/styles/editor.css'
import mixins from '../mixins'
import LocalDAO from '../../../../db/api';

export default {
  name: 'EditorComp',

  mixins: mixins,

  data () {
    return {
      editor: null,
      writer: null,
      fileId: null,
      isInit: false,
      showMask: true
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
    currentFile (val) {
      console.log('currentFile-watch', val)
      // this.SET_EDITOR_CONTENT_CACHE(val.content)
      // this.editor.setData(val)
    },

    viewType (val) {
      console.log('watch-viewType', val)
      this.handleResize()
    }
  },

  mounted () {
    this.initEditor()
    this.$hub.pool.push(() => {
      this.handleResize()
    })
  },

  methods: {
    ...mapActions([
      'SAVE_DOC',
      'EDIT_DOC',
      'SET_EDITOR_CONTENT_CACHE',
      'EDIT_FILE'
    ]),

    initEditor () {
      // console.log(CKEDITOR)
      console.log('initEditor', this.editor)
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
        // this.content = this.editor.getData()
        // this.SET_EDITOR_CONTENT_CACHE(this.editor.getData())
      })
      this.editor.on('dataReady', () => {
        console.log('dataReady', this.editor.getData())
        // this.editor.resetUndo()
      })
      this.editor.on('blur', () => {
        // this.saveData()
        // this.editor.resetUndo()
      })
      // this.editor.on('beforeDestroy', () => {
      //   console.log('beforeDestroy')
      //   // this.saveData()
      //   // this.editor.resetUndo()
      // })
      this.editor.on('destroy', () => {
        console.log('destroy')
        this.showMask = true
        // this.editor.resetUndo()
      })
      // this.editor.on('afterSetData', () => {
      //   console.log('afterSetData', this.isInit)
      //   if (this.isInit) {
      //     this.editor.resetUndo()
      //     this.isInit = false
      //   }
      //   // this.editor.resetUndo()
      // })
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

    onEditorReady () {
      console.log('editorReady', this.content, this.contentCache, this.isInit)
      this.SET_EDITOR_CONTENT_CACHE(this.currentFile.content)
      this.isInit = true
      this.editor.setData(this.currentFile.content || '')
      setTimeout(() => {
        this.editor.resetUndo()
      }, 30)
      setTimeout(() => {
        this.showMask = false
      }, 300)
      this.fileId = this.currentFile.id
      this.handleResize()
    },

    saveData () {
      console.log('saveData', this.editor.getData(), '1111', this.contentCache, '2222', this.editor.getData() === this.contentCache)
      if (this.editor.getData() !== this.contentCache) {
        // this.EDIT_FILE({
        //   id: this.currentFile.id,
        //   content: this.content
        // })
        this.EDIT_DOC({
          id: this.fileId,
          content: this.editor.getData()
        })
      }
      // this.SAVE_DOC({
      //   id: this.currentFile.id,
      //   html: this.editor.getData()
      // })
    },

    handleResize () {
      let space = this.viewType === 'expanded' ? 540 : 390
      let w = document.body.clientWidth - space
      this.$refs.container.style.width = w + 'px'

      let h = document.body.clientHeight - document.getElementsByClassName('cke_top cke_reset_all')[0].getBoundingClientRect().height - 80
      this.editor.resize(w, h, true)
    }
  }
}
</script>

<style lang="stylus" scoped>
#editor
  position relative
.mask
  position absolute
  width 100%
  height 100%
  top 0
  left 0
  background-color #fff
</style>
