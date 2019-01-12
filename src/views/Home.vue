<template>
  <div class="home">
    <PageLayout>
      <div slot="left">
        <DocumentList></DocumentList>
      </div>
      <div slot="right">
        <EditorComp style="height: 100%"></EditorComp>
      </div>
    </PageLayout>
  </div>
</template>

<script>
import PageLayout from '@/components/PageLayout.vue'
import DocumentList from '@/components/DocumentList.vue'
import EditorComp from '@/components/EditorComp.vue'

export default {
  name: 'home',

  components: {
    PageLayout,
    DocumentList,
    EditorComp
  }
}
</script>

<style lang="stylus" scoped>
.home
  // flex 1
  height 100%
  display flex
  flex-direction column
</style>
