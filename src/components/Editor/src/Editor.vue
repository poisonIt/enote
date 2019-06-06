<template>
  <div id="editor-container">
    <textarea name="content" ref="editor" id="editor"></textarea>
    <div class="mask" v-show="showMask"></div>
    <webview id="pdf-path"></webview>
  </div>
</template>

<script>
import fs from 'fs'
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'
import uploadAdapter from './upload'
import linkShell from './linkShell'
import '../../../assets/styles/editor.css'
import { getLocalDoc, updateLocalDoc } from '@/service/local'
import fetchLocal from '../../../utils/fetchLocal'

const ClassicEditor = window.ClassicEditor

export default {
  name: 'EditorComp',

  mixins: mixins,

  data () {
    return {
      cachedDoc: {
        id: '',
        content: ''
      },
      currentDoc: {},
      showMask: true,
      editor: null
    }
  },

  computed: {
    ...mapGetters({
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
      if (val && val.type === 'note') {
        this.showMask = true
        if (val.trash !== 'NORMAL') {
          this.showMask = true
          return
        }
        if (this.editor) {
          // 切换选中笔记，保存上一个笔记修改内容
          let editorData = this.editor.getData()
          if (editorData !== this.cachedDoc.content) {
            this.saveData(this.cachedDoc._id, editorData)
          }
        }
        fetchLocal('getLocalDoc', {
          note_id: val._id
        }).then(res => {
          this.currentDoc = res
          this.cachedDoc = {
            _id: res._id,
            content: res.content
          }
          this.initEditor(res.content)
        })
      }
    },

    viewType (val) {
      this.handleResize()
    }
  },

  created () {
    ipcRenderer.on('communicate', (event, arg) => {
      if (arg.from === 'Preview' && arg.tasks.indexOf('updateEditorDoc') > -1) {
        let res = arg.params[arg.tasks.indexOf('updateEditorDoc')]
        if (this.currentDoc._id === res.id)
        this.editor.setData(res.content)
      }
    })

    ipcRenderer.on('wrote-pdf', (event, path) => {
      let webviewPDF = document.getElementById('pdf-path')
      let tempPath = this.$remote.app.appConf.resourcePath + `/${this.currentFile._id}.html`

      let dev_url = this.$remote.app.appConf.dev_url
      console.log('process.env.WEBPACK_DEV_SERVER_URL', dev_url)

      fs.writeFile(tempPath, this.editor.getData(), (err, data) => {
        let url = dev_url
          ? dev_url + `#/pdf?note_id=${this.currentFile._id}`
          : `app://./index.html#/pdf?note_id=${this.currentFile._id}`
        webviewPDF.src = url
        webviewPDF.printToPDF({}, (error, data) => {
          fs.writeFile(path, data, function (error) {
            if (error) {
              throw error
            }
          })
        })
      })
    })
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

    initEditor (content) {
      const _self = this
      if (this.editor) {
        this.editor.setData(content || '')
        this.showMask = false
      } else {
        ClassicEditor
          .create(this.$refs.editor, {
            // fontFamily: {
            //   options: [
            //     'default',
            //     '微软雅黑'
            //   ]
            // },
            extraPlugins: [ uploadAdapter, linkShell ],
            autosave: {
              save (editor) {
                let editorData = editor.getData()
                if (_self.currentDoc._id === _self.cachedDoc._id
                  && editorData !== _self.cachedDoc.content) {
                  _self.saveData(_self.currentDoc._id, editorData)
                  // _self.cachedDoc.content = editorData
                }
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
            this.editor.ui.focusTracker.on('change:isFocused', (val) => {
              if (!this.editor.ui.view.editable.isFocused) {
                let editorData = this.editor.getData()
                if (this.currentDoc._id === this.cachedDoc._id &&
                  editorData !== this.cachedDoc.content) {
                  this.$hub.dispatchHub('pushData', this)
                  this.cachedDoc.content = editorData
                }
              }
            })
            this.editor.setData(content || '')
            this.cachedDoc._id = this.currentDoc._id
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
      let space = this.viewType === 'expanded' ? 540 : 390
      document.getElementsByClassName('ck ck-editor__main')[0].style.width = document.body.clientWidth - space + 'px'
    },

    saveData (id, content) {
      console.log('saveData', id, content)
      fetchLocal('updateLocalDoc', {
        id: id,
        content: content
      }).then(res => {
        let req = {
          id: this.currentFile._id,
          summary: res
        }
        this.$hub.dispatchHub('updateDoc', this, req)
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
#editor-container
  position relative
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
