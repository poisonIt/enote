<template>
  <div id="preview">
    <div class="header">{{ title }}</div>
    <textarea name="content" ref="editor" id="editor"></textarea>
    <div class="mask" v-show="showMask"></div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import uploadAdapter from '../components/Editor/src/upload'
import '../assets/styles/editor.css'
import { getLocalDoc, updateLocalDoc } from '@/service/local'

export default {
  name: 'EditorComp',


  data () {
    return {
      doc: {},
      title: '',
      editorData: '',
      showMask: true,
      editor: null
    }
  },

  created () {
    let query = this.$router.currentRoute.query
    console.log('query', query)
    let noteId = query.note_id
    this.title = query.title
    this.SET_CURRENT_FILE({
      _id: noteId
    })

    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from === 'Preview') {
        console.log('fetch-local-data-response', event, arg)
        if (arg.tasks.indexOf('getLocalDoc') > -1) {
          let res = arg.res[arg.tasks.indexOf('getLocalDoc')]
          this.doc = res
          this.initEditor(res.content)
        }
      }
    })
    
    ipcRenderer.send('fetch-local-data', {
      tasks: ['getLocalDoc'],
      params: [{ note_id: noteId }],
      from: 'Preview'
    })
  },

  methods: {
    ...mapActions([
      'SET_CURRENT_FILE'
    ]),

    initEditor (content) {
      const _self = this
      if (this.editor) {
        this.editor.setData(content || '')
        console.log('22222')
        this.showMask = false
      } else {
        ClassicEditor
          .create(this.$refs.editor, {
            // language: 'zh-cn',
            // toolbar: [ 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor'],
            // // toolbar: [ 'bulletedList' ],
            // // toolbar: [ 'undo', 'redo', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'highlight:yellowMarker', 'Image' ],
            extraPlugins: [ uploadAdapter ],
            autosave: {
              save (editor) {
                _self.editorData = editor.getData()
                ipcRenderer.send('communicate', {
                  tasks: ['updateEditorDoc'],
                  params: [{
                    id: _self.doc._id,
                    content: _self.editorData,
                  }],
                  from: 'Preview'
                })
                _self.saveData(_self.doc._id, _self.editorData)

                // if (_self.currentDoc._id === _self.cachedDoc._id
                //   && editorData !== _self.cachedDoc.content) {
                //   _self.saveData(_self.currentDoc._id, editorData)
                //   _self.cachedDoc.content = editorData
                // }
              }
            },
          })
          .then(editor => {
            this.editor = editor
            this.editor.setData(content || '')
            // this.cachedDoc = {
            //   _id: this.currentDoc._id,
            //   content: content
            // }
            this.handleEditorReady()
            this.showMask = false
          })
          .catch(error => {
            console.error(error)
          })
      }
    },

    handleEditorReady (editor) {
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
    },

    handleResize () {
      document.getElementsByClassName('ck-content')[0].style.width = document.body.clientWidth + 'px'
    },

    saveData (id, content) {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalDoc'],
        params: [{
          id: id,
          content: content,
        }],
        from: 'Preview'
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
#preview
  position relative
.header
  width 100%
  height 30px
  background-color rgb(60, 62, 68)
  color #fff
  line-height 30px
  text-align center
  -webkit-app-region drag
.ck-editor
  height 100% !important
.mask
  position absolute
  width 100%
  height 100%
  top 0
  left 0
  background-color #fff
  z-index 9999
</style>
