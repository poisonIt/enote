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
      allFileMap: 'GET_FILES',
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
      let allFileMap = this.allFileMap
      function getChildren (file) {
        file.children = file._child_folders.map(item => {
          return getChildren(allFileMap[item])
        }).sort((a, b) => a.seq - b.seq)
        return file
      }
      let rootChildFolders = []
      for (let i in folders) {
        rootChildFolders.push(cloneShallow(getChildren(folders[i])))
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
