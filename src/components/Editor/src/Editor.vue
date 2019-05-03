<template>
  <div id="editor-container">
    <textarea name="content" ref="editor" id="editor"></textarea>
    <div class="mask" v-show="showMask"></div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import uploadAdapter from './upload'
import Autosave from '@ckeditor/ckeditor5-autosave/src/autosave'
import '@ckeditor/ckeditor5-build-classic/build/translations/zh-cn'
import '../../../assets/styles/editor.css'
import { getLocalDoc, updateLocalDoc } from '@/service/local'

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
        if (this.editor) {
          // 切换选中笔记，保存上一个笔记修改内容
          let editorData = this.editor.getData()
          if (editorData !== this.cachedDoc.content) {
            console.log('0000000')
            this.saveData(this.cachedDoc._id, editorData)
          }
        }
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getLocalDoc'],
          params: [{ note_id: val._id }],
          from: 'Editor'
        })
        // getLocalDoc({ note_id: val._id }).then(res => {
        //   console.log('getLocalDoc-res', res)
        //   this.currentDoc = res
        //   this.cachedDoc = {
        //     _id: res._id,
        //     content: res.content
        //   }
        //   this.initEditor(res.content)
        // })
      }
    },

    viewType (val) {
      this.handleResize()
    }
  },

  created () {
    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      if (arg.from === 'Editor') {
        console.log('fetch-local-data-response', event, arg)
        if (arg.tasks.indexOf('getLocalDoc') > -1) {
          let res = arg.res[arg.tasks.indexOf('getLocalDoc')]
          this.currentDoc = res
          this.cachedDoc = {
            _id: res._id,
            content: res.content
          }
          this.initEditor(res.content)
        }
      }
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
        console.log('22222')
        this.showMask = false
      } else {
        ClassicEditor
          .create(this.$refs.editor, {
            language: 'zh-cn',
            // toolbar: [ 'undo', 'redo', 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'highlight:yellowMarker', 'Image' ],
            extraPlugins: [ uploadAdapter, Autosave ],
            autosave: {
              save (editor) {
                let editorData = editor.getData()
                if (_self.currentDoc._id === _self.cachedDoc._id
                  && editorData !== _self.cachedDoc.content) {
                  _self.saveData(_self.currentDoc._id, editorData)
                  _self.cachedDoc.content = editorData
                }
              }
            },
          })
          .then(editor => {
            this.editor = editor
            this.editor.setData(content || '')
            this.cachedDoc = {
              _id: this.currentDoc._id,
              content: content
            }
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
      console.log('handleResize', space)
      document.getElementsByClassName('ck-content')[0].style.width = document.body.clientWidth - space + 'px'
    },

    saveData (id, content) {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalDoc'],
        params: [{
          id: id,
          content: content,
        }],
        from: 'Editor'
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
