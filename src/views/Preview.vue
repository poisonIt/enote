<template>
  <div id="preview">
    <div class="title"></div>
    <div>
      <Editor style="height: 100%"></Editor>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import Editor from '@/components/Editor'

export default {
  name: 'Preview',

  components: {
    Editor
  },

  data () {
    return {
      content: ''
    }
  },

  created () {
    console.log(this.$router)
    // ipcRenderer.on('fetch-local-data-response', (event, arg) => {
    //   if (arg.from === 'Preview') {
    //     console.log('fetch-local-data-response', event, arg)
    //     if (arg.tasks.indexOf('getLocalDoc') > -1) {
    //       let res = arg.res[arg.tasks.indexOf('getLocalDoc')]
    //       this.content = res.content
    //     }
    //   }
    // })
  },

  mounted () {
    let noteId = this.$router.currentRoute.query.note_id

    // ipcRenderer.send('fetch-local-data', {
    //   tasks: ['getLocalDoc'],
    //   params: [{ note_id: noteId }],
    //   from: 'Preview'
    // })
  }
}
</script>

<style lang="stylus" scoped>
#preview
  height 100%
  padding 40px 20px
  overflow scroll

.title
  width 100%
  height 40px
  position fixed
  top 0
  z-index 99999
  -webkit-app-region drag
</style>

