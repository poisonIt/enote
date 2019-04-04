<template>
  <div id="editor-container" ref="editor"></div>
</template>

<script>
// import '../lib/bulb/bulb.min.css'
import BulbEditor from '../lib/bulb/bulb.min.js'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'EditorComp',

  data () {
    return {
      editor: null,
      editorHtml: ''
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
      if (this.editor) {
        console.log('setContent', val)
        this.editor.setContent(val, {
            async: true,
        }).then(() => {
          console.log('done')
          this.editorHtml = val
        })
      }
    },

    currentFile (val, oldVal) {
      if (oldVal) {
        this.saveData(oldVal)
      }
    },

    viewType (val) {
      this.handleResize()
    }
  },

  mounted () {
    console.log('BulbEditor', BulbEditor)
    (authBulbEditor({
      url: 'http://updateinfo.youdao.com/editorapi',
      pkn: 'com.youdao.com',
      appKey: '656d2fdc0a922cc6',
      version: 'v1',
      sdkVersion: 'v1',
      appSecret: 'fPduC1Gw2UnS7zqs9k9fsKcVxcuoiUmI',
    })).then((BulbEditor) => {
      console.log('BulbEditor', BulbEditor.toString())
      this.editor = new BulbEditor({
        el: this.$refs.editor
      })

      this.editor.setContent(this.content, {
        async: true,
      }).then(() => {
        console.log('done')
      })

      this.editor.on('content-change', () => {
        this.editor.getContent({
          type: 'xml',
          async: true
        }).then(xml => {
          console.log(xml)
          this.editorHtml = xml.content
        })
      })
    })
  },

  methods: {
    ...mapActions(['SAVE_DOC']),

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

    saveData (file) {
      console.log('saveData', file, this.editorHtml)
      this.SAVE_DOC({
        id: file.id,
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
#editor
  // margin-top 40px
</style>
