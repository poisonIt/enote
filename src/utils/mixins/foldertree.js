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
      console.log('initNav', folders)
      let rootChildFolders = []
      for (let i in folders) {
        if (!folders[i].parent_folder) {
          rootChildFolders.push(folders[i])
        }
      } 
      // console.log('rootChildFolders', rootChildFolders)
      // let rootFolder = rootChildFolders
      //   .map(folder => this.translateFolderData(folder, folders))[0]

      // console.log('rootFolder', rootFolder)
      // for (let i in rootFolder) {
      //   this.$set(this.nav[this.folderIndex], i, rootFolder[i])
      // }
      console.log('nav', this.nav)

      this.$set(this.nav[this.folderIndex], 'children', rootChildFolders)

      console.log('nav', this.nav)

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
      console.log('translateFolderData', folder.getChildFolders())
      // result.children = folder.child_folders.map(id => {
      //   return this.translateFolderData(folders[id], folders)
      // })
      return result
    }
  }
}
