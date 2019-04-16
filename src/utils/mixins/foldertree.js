import { mapGetters } from 'vuex'
import { clone } from 'lodash'

export default {

  data () {
    return {
      folder: {}
    }
  },

  computed: {
    ...mapGetters({
      folders: 'GET_FOLEDERS'
    })
  },

  watch: {
    folders (val, oldVal) {
      console.log('watch', val, oldVal)
      if (val !== oldVal) {
        this.initNav(val)
      }
    }
  },

  methods: {
    initNav (folders) {
      let rootChildFolders = []
      for (let i in folders) {
        if (folders[i].parent_folder === '/') {
          rootChildFolders.push(cloneShallow(folders[i]))
        }
      }
      rootChildFolders = rootChildFolders.sort((a, b) => {
        return a.seq - b.seq
      })
      console.log('rootChildFolders', rootChildFolders)
      this.$set(
        this.nav[this.folderIndex],
        'children',
        rootChildFolders
      )
      console.log('nav', this.nav, this.folderIndex)
    }
  }
}

function cloneShallow (obj) {
  let result = {}
  for (let i in obj) {
    result[i] = obj[i]
  }
  return result
}
