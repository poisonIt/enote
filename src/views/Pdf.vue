<template>
  <div id="pdf">
    <div class="ck-blurred ck ck-content ck-editor__editable ck-rounded-corners ck-editor__editable_inline" v-html="html"></div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import fetchLocal from '../utils/fetchLocal'
import uploadAdapter from '../components/Editor/src/upload'
import '../assets/styles/editor.css'

export default {
  name: 'EditorComp', 

  data () {
    return {
      html: ''
    }
  },

  created () {
    let query = this.$router.currentRoute.query
    let noteId = query.note_id
    this.title = query.title

    fetchLocal('getLocalDoc', {
      note_id: noteId
    }).then(res => {
      this.html = res.content
      this.$nextTick(() => {
        setTimeout(() => {
          ipcRenderer.send('wrote-pdf')
        }, 3000)
      })
    })
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
