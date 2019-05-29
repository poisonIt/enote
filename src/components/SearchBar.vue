<template>
  <div class="search">
    <input type="text" v-model="searchText" placeholder="搜索">
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'SearchBar',

  data () {
    return {
      searchText: ''
    }
  },

  watch: {
    searchText (val) {
      this.SET_SEARCH_KEYWORD(val)
    }
  },

  methods: {
    ...mapActions(['SET_SEARCH_KEYWORD'])
  }
}
</script>

<style lang="stylus" scoped>
.search
  width 178px
  height 32px
  background-color #fff
  border-radius 16px
  border 1px solid #E9E9E9
  overflow hidden
  input
    width 100%
    height 100%
    border none
    outline none
    padding-left 10px
</style>

