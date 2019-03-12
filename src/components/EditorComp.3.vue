<template>
  <div id="editor">
    <div ref="editor" id="editor-container"></div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import wangEditor from 'wangeditor'
import '../assets/styles/editor.css'

export default {
  name: 'EditorComp',

  data () {
    return {
      editorHtml: '<p></p>',
      editor: null
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
      console.log('0000', val)
      // this.editorHtml = val
      this.editor.txt.html(val)
    },

    viewType (val) {
      this.handleResize()
    },

    currentFile (val, oldVal) {
      if (oldVal !== val) {
        this.editor.txt.html('')
        this.saveData(oldVal)
      }
    }
  },

  mounted () {
    this.editor = new wangEditor(this.$refs.editor)
    this.editor.customConfig.menus = [
      'undo',  // 撤销
      'redo',  // 重复
      'head',  // 标题
      'bold',  // 粗体
      'fontSize',  // 字号
      'fontName',  // 字体
      'italic',  // 斜体
      'underline',  // 下划线
      'strikeThrough',  // 删除线
      'foreColor',  // 文字颜色
      'backColor',  // 背景颜色
      'link',  // 插入链接
      'list',  // 列表
      'justify',  // 对齐方式
      'quote',  // 引用
      'image',  // 插入图片
      'table',  // 表格
    ]
    this.editor.customConfig.onchange = (html) => {
      this.editorHtml = html
    }
    // this.editor.customConfig.onblur = (html) => {
    //   this.saveData()
    // }
    this.editor.create()
    this.onEditorReady()
  },

  methods: {
    ...mapActions(['SAVE_DOC']),

    onEditorReady () {
      this.handleResize()
      this.$hub.pool.push(() => {
        this.handleResize()
      })
    },

    handleEditorInput () {
      // console.log('handleEditorInput', this.editorInstance.getData())
    },

    saveData () {
      console.log('saveData')
      this.SAVE_DOC({
        id: this.currentFile.id,
        html: this.editorHtml
      })
    },

    handleResize () {
      let space = this.viewType === 'expanded' ? 500 : 360
      document.getElementById('editor-container').style.width = document.body.clientWidth - space + 'px'
      document.getElementsByClassName('w-e-text-container')[0].style.height = document.body.clientHeight - document.getElementsByClassName('w-e-toolbar')[0].getBoundingClientRect().height - 100 + 'px'
    }
  }
}
</script>

<style lang="stylus" scoped>
#editor
  // margin-top 40px
</style>
