<template>
  <div id="preview">
    <div class="header" v-if="isPdf !== '1'">{{ title }}</div>
    <textarea name="content" ref="editor" id="editor"></textarea>
    <div class="mask" v-show="showMask"></div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapActions } from 'vuex'
import fetchLocal from '../utils/fetchLocal'
import uploadAdapter from '../components/Editor/src/upload'
import '../assets/styles/editor.css'

const ClassicEditor = window.ClassicEditor

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
    let noteId = query.note_id
    this.title = query.title
    this.isPdf = query.isPdf

    this.SET_CURRENT_FILE({
      _id: noteId
    })

    fetchLocal('getLocalDoc', {
      note_id: noteId
    }).then(res => {
      this.doc = res
      this.initEditor(res.content)
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
        this.showMask = false
      } else {
        ClassicEditor
          .create(this.$refs.editor, {
            extraPlugins: [ uploadAdapter ],
            autosave: {
              save (editor) {
                _self.editorData = editor.getData()
                ipcRenderer.send('communicate', {
                  tasks: ['refreshDocumentList'],
                  from: 'Preview'
                })
                _self.saveData(_self.doc._id, _self.editorData)
              }
            },
            link: {
              click (href) {
                // console.log(href.match(/^(?:(?:https?|ftps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i))
                ipcRenderer.send('open-external', href)
              }
            }
          })
          .then(editor => {
            this.editor = editor
            this.editor.setData(content || '')
            this.handleEditorReady()
            this.showMask = false
            if (this.isPdf === '1') {
              document.getElementsByClassName('ck-editor__top')[0].style = 'display: none;'
              setTimeout(() => {
                ipcRenderer.send('wrote-pdf')
              }, 3000)
            }
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
      fetchLocal('updateLocalDoc', {
        id: id,
        content: content
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
#preview
  position relative
  height 100%
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
