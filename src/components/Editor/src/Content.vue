<template>
  <div id="container">
    <div
      class="editor-container_body"
      :style="{ width: containerWidth }"
    >
      <textarea name="content" ref="editor" id="editor"></textarea>
    </div>
  </div>

</template>

<script>
const ClassicEditor = window.ClassicEditor
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'Content',
  watch: {
    viewType (val) {
      this.handleResize()
    },
  },




  computed: {
    ...mapGetters({
      viewType: 'GET_VIEW_TYPE',
      isShowed: 'GET_SHOW_TAG_HANDLER',
      currentNav: 'GET_CURRENT_NAV',
      currentFile: 'GET_CURRENT_FILE',
    }),
  },
  data () {
    return {
      editor: null,containerWidth: '0px',
    }
  },
  mounted() {
    this.initEditor(`<ul><li>哒哒哒哒哒哒哒<ul><li>都是对的多多<ul><li>东方闪电佛挡杀佛<ul><li>都是范德萨范德</li></ul></li></ul></li></ul></li></ul><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><ul><li>ddddddddddddddddd<ul><li>dddddddddd<ul><li>ddddddddd<ul><li>ddddddddd<ul><li>ddddddd<ul><li>ddsafdasfasdfasdfadsfasd<ul><li>dsafdsafdasfdasmksadmfkasmkfmaskmfkasm</li></ul></li></ul></li></ul></li></ul></li></ul></li></ul></li></ul><p style="margin-left:80px;">&nbsp;</p><p style="margin-left:80px;">&nbsp;</p><p style="margin-left:80px;">&nbsp;</p><ol><li>dddddd</li><li>dsmdskfmkasdmfksamdkfmsakdmfksadmfkmasdkfmksamfkmds</li><li>dsfasdfdsafasdfsadfasdfadsf<ol><li>dddddd<ol><li>dsfdsafdsafdsa</li><li>adsfdasfdsafdsa</li><li>dasfdsaf<ol><li>dsfasdfasdfasd<ol><li>fdsafdas</li></ol></li></ol></li></ol></li></ol></li></ol><p style="margin-left:40px;">&nbsp;</p><p style="margin-left:40px;">&nbsp;</p>`)
  },
  mounted () {
    this.handleResize()
    this.$hub.pool.push(() => {
      this.handleResize()
    })

    window.addEventListener('click', this.handleWindowClick)
  },
  methods: {
    initEditor (content, config) {
      const _self = this
        ClassicEditor
          .create(this.$refs.editor, {

          })
          .then(editor => {
            this.editor = editor
            this.editor.setData(content)
          })
          .catch(error => {
            console.error(error)
          })
      },
      handleResize () {
        this.$nextTick(() => {
          let space = this.viewType === 'expanded' ? 540 : 390
          console.log(space)
          console.log( document.body.clientWidth)
          this.containerWidth = document.body.clientWidth - space + 'px'
        })
      },
  },
}
</script>

<style lang="stylus" scoped>
.container
  width 100%
</style>

