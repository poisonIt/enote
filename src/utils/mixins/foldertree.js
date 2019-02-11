import { mapGetters } from 'vuex'

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
      if (val !== oldVal) {
        this.initNav(val)
      }
    }
  },

  methods: {
    initNav (folders) {
      let rootChildFolders = []
      for (let i in folders) {
        if (folders[i].ancestor_folders.length === 0) {
          rootChildFolders.push(folders[i])
        }
      }
      let rootFolder = rootChildFolders
        .map(folder => this.translateFolderData(folder, folders))[0]
      for (let i in rootFolder) {
        this.$set(this.nav[this.folderIndex], i, rootFolder[i])
      }

      // let rootNode = this.$refs.tree.store.root
      // this.$refs.tree.setNodeData(rootNode.childNodes[1].uid, rootFolder)

      // if (this.initFlag) {
      //   this.handleItemClick(this.$refs.tree.store.root.childNodes[0])
      //   this.initFlag = false
      // }
    },

    translateFolderData (folder, folders) {
      let result = {}
      for (let i in folder) {
        result[i] = folder[i]
      }
      result.children = folder.child_folders.map(id => {
        return this.translateFolderData(folders[id], folders)
      })
      return result
    }
  }
}
