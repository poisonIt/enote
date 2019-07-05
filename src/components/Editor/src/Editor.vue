<template>
  <div id="editor-container">
    <textarea name="content" ref="editor" id="editor"></textarea>
    <div class="high-light-mask"
      ref="highLightMask"
      v-show="locations.length > 0 && showHighLight"
      :style="{ top: -scrollTop + 'px' }">
      <ul>
        <li v-for="(item, index) in locations"
          :key="index"
          :style="locStyle(item)">
        </li>
      </ul>
    </div>
    <div class="mask" v-show="showMask"></div>
    <webview id="pdf-path"></webview>
  </div>
</template>

<script>
import fs from 'fs'
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'
import { matchIndex, getStrPixelLen } from '../../../utils/utils'
import uploadAdapter from './upload'
import '../../../assets/styles/editor.css'
import fetchLocal from '../../../utils/fetchLocal'

const ClassicEditor = window.ClassicEditor

export default {
  name: 'EditorComp',

  mixins: mixins,

  data () {
    return {
      selectedKeyIdx: 0,
      showHighLight: false,
      cachedDoc: {
        id: '',
        content: ''
      },
      currentDoc: {},
      showMask: true,
      editor: null,
      locations: [],
      scrollTop: 0
    }
  },

  computed: {
    ...mapGetters({
      currentNav: 'GET_CURRENT_NAV',
      currentFile: 'GET_CURRENT_FILE',
      viewType: 'GET_VIEW_TYPE'
    })
  },

  watch: {
    currentFile (val, oldVal) {
      this.showHighLight = false
      this.locations = []
      this.selectedKeyIdx = 0
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
        // if (this.editor) {
        //   // 切换选中笔记，保存上一个笔记修改内容
        //   let editorData = this.editor.getData()
        //   if (editorData !== this.cachedDoc.content) {
        //     this.saveData(this.cachedDoc._id, editorData)
        //   }
        // }
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
    // ipcRenderer.on('communicate', (event, arg) => {
    //   if (arg.from === 'Preview' && arg.tasks.indexOf('updateEditorDoc') > -1) {
    //     let res = arg.params[arg.tasks.indexOf('updateEditorDoc')]
    //     if (this.currentDoc._id === res.id) {
    //       this.editor.setData(res.content)
    //     }
    //   }
    // })

    ipcRenderer.on('wrote-pdf', (event, path) => {
      let webviewPDF = document.getElementById('pdf-path')
      let tempPath = this.$remote.app.appConf.resourcePath + `/${this.currentFile._id}.html`

      let devUrl = this.$remote.app.appConf.dev_url
      console.log('process.env.WEBPACK_DEV_SERVER_URL', devUrl)

      fs.writeFile(tempPath, this.editor.getData(), (err, data) => {
        if (err) {
          console.warn(err)
        }
        let url = devUrl
          ? devUrl + `#/pdf?note_id=${this.currentFile._id}`
          : `app://./index.html#/pdf?note_id=${this.currentFile._id}`
        webviewPDF.src = url
        webviewPDF.printToPDF({}, (error, data) => {
          if (error) {
            throw error
          }
          fs.writeFile(path, data, function (err) {
            if (err) {
              throw err
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

    initEditor (content, config) {
      const _self = this
      if (this.editor) {
        this.editor.isReadOnly = false
        document.getElementsByClassName('ck-editor__top')[0].style.display = 'block'
        this.editor.setData(content || '')
        if (this.currentNav.type === 'share') {
          this.editor.isReadOnly = true
          document.getElementsByClassName('ck-editor__top')[0].style.display = 'none'
        }
        this.showMask = false
      } else {
        ClassicEditor
          .create(this.$refs.editor, {
            fontFamily: {
              options: [
                // 设置的字体名字？
                // 'default',
                // '微软雅黑/Microsoft YaHei',
                '黑体',
                '微软雅黑',
                '宋体',
                '仿宋',
                '楷体',
                '新仿宋',
                'Arial',
                'Arial Black',
                'Courier BOLDITALIC',
                'tahoma',
                'Verdana',
                'Times-Roman'
              ]
            },
            extraPlugins: [ uploadAdapter ],
            autosave: {
              save (editor) {
                let editorData = editor.getData()
                if (_self.currentDoc._id === _self.cachedDoc._id &&
                  editorData !== _self.cachedDoc.content) {
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
            this.editor.isReadOnly = false
            this.editor.setData(content || '')
            if (this.currentNav.type === 'share') {
              this.editor.isReadOnly = true
              document.getElementsByClassName('ck-editor__top')[0].style.display = 'none'
              this.showMask = false
              return
            }
            this.cachedDoc._id = this.currentDoc._id

            this.editor.ui.focusTracker.on('change:isFocused', (val) => {
              console.log('isFocused', this.editor.ui.view.editable.isFocused)
              if (!this.editor.ui.view.editable.isFocused) {
                let editorData = this.editor.getData()
                if (this.currentDoc._id === this.cachedDoc._id &&
                  editorData !== this.cachedDoc.content) {
                  this.saveData(this.cachedDoc._id, editorData).then(() => {
                    this.$hub.dispatchHub('pushData', this)
                    this.cachedDoc.content = editorData
                  })
                }
              } else {
                this.showHighLight = false
              }
            })
            this.handleEditorReady()
            this.showMask = false

            let editorMainEl = document.getElementsByClassName('ck-content')[0]
            editorMainEl.addEventListener('scroll', () => {
              this.scrollTop = editorMainEl.scrollTop
            })
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
      let el = document.getElementsByClassName('ck ck-editor__main')[0]
      if (el) {
        el.style.width = document.body.clientWidth - space + 'px'
      }
    },

    async saveData (id, content) {
      await fetchLocal('updateLocalDoc', {
        id: id,
        content: content
      }).then(res => {
        let req = {
          id: this.currentFile._id,
          summary: res
        }
        this.$hub.dispatchHub('updateDoc', this, req)
      })
    },

    handleSearchContent (keywords) {
      this.locations = []
      this.selectedKeyIdx = 0
      let idx = 0
      if (keywords === '') {
        return
      }
      const reg = new RegExp(keywords)
      const keywordsPixelLen = getStrPixelLen(keywords)

      let contentEl = document.getElementsByClassName('ck-content')[0]
      let pEls = Array.prototype.slice.call(contentEl.getElementsByTagName('p'))
      let spanEls = Array.prototype.slice.call(contentEl.getElementsByTagName('span'))
      let strongEls = Array.prototype.slice.call(contentEl.getElementsByTagName('strong'))
      let codeEls = Array.prototype.slice.call(contentEl.getElementsByTagName('code'))

      let textEls = pEls.concat(spanEls)

      textEls = textEls.filter(el => {
        return el.innerText.match(reg) !== null
      })

      textEls.forEach(el => {
        const elPos = {
          top: el.offsetTop,
          left: el.offsetLeft
        }
        const h = el.offsetHeight
        const fontSize = Number(getComputedStyle(el).fontSize.replace('px', ''))
        const s = matchIndex(el.innerText, reg, true)

        s.forEach(item => {
          this.locations.push({
            index: idx++,
            top: el.offsetTop,
            left: el.offsetLeft + item.left * fontSize,
            width: keywordsPixelLen * fontSize,
            height: fontSize + 6,
            fontSize: fontSize,
            text: keywords,
            el: el,
            elStyle: getComputedStyle(el)
          })
        })
      })
      this.showHighLight = true
      console.log('locations', this.locations)
      console.log(this.editor)
      console.log(this.editor.editing.view.domRoots.main)
      // console.log(this.editor.model.document)
      // console.log(this.editor.model.document.selection)
      // console.log(this.editor.model.document.selection.getRanges())
    },

    locStyle (item) {
      return {
        position: 'absolute',
        top: item.top + 'px',
        left: item.left + 'px',
        width: item.width + 'px',
        height: item.height + 'px',
        fontSize: item.fontSize + 'px',
        backgroundColor: 'rgb(255, 235, 0, 0.4)',
        borderRadius: '2px',
        boxSizing: 'content-box',
        border: item.index === this.selectedKeyIdx ? '2px solid #ffa80a' : 'none'
      }
    },

    selectPrevSearchKey () {
      if (this.selectedKeyIdx > 0) {
        this.selectedKeyIdx --
      } else {
        this.selectedKeyIdx = this.locations.length - 1
      }
    },

    selectNextSearchKey () {
      if (this.selectedKeyIdx < this.locations.length - 1) {
        this.selectedKeyIdx ++
      } else {
        this.selectedKeyIdx = 0
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
#editor-container
  position relative
  overflow hidden

.ck-editor
  height 100% !important

.high-light-mask
  position absolute
  top 0
  width 100%
  height 100%
  pointer-events none
  z-index 1

.mask
  position absolute
  width 100%
  height 100%
  top 0
  left 0
  background-color #fff
  z-index 9999
</style>
