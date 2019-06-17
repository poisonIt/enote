<template>
  <div class="editor-content">
    <div class="ck-blurred ck ck-content ck-editor__editable ck-rounded-corners ck-editor__editable_inline" v-html="content"></div>
  </div>
</template>

<script>
import '../../../assets/css/ck-editor.css'

export default {
  name: 'Content',

  data () {
    return {
      content: '<p>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br>我也不知道做到哪里了<br><br data-cke-filler="true"></p>'
    }
  }
}
</script>

<style lang="stylus" scoped>
.editor-content
  position absolute
  top 0
  width 100%
</style>

