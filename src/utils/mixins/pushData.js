import pReduce from 'p-reduce'
import { mapGetters, mapActions } from 'vuex'
import { pushNotebook, pushNote, createTag } from '@/service'

export default {
  data () {
    return {
    }
  },

  computed: {
    ...mapGetters({
      allFileMap: 'GET_FILES',
      allTagMap: 'GET_TAGS_MAP',
      isSyncing: 'GET_IS_SYNCING',
      tagsNeedPush: 'GET_TAGS_NEED_PUSH',
      filesNeedPush: 'GET_FILES_NEED_PUSH'
    })
  },

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
      'SET_FILE_PUSH_FINISHED'
    ]),

    tranData (file) {
      let parentFolder = this.allFileMap[file.parent_folder]

      if (file.type === 'folder') {
        return {
          noteBookId: file.remote_id || file.id,
          parentId: parentFolder ? parentFolder.remote_id : '/',
          seq: file.seq,
          title: file.title,
          trash: file.trash
        }
      } else if (file.type === 'doc') {
        return {
          noteBookId: parentFolder ? parentFolder.remote_id : '/',
          noteContent: file.content,
          noteId: file.remote_id || file.id,
          title: file.title,
          trash: file.trash,
          top: file.top,
          tagId: file.tags.map(tagId => {
            let tag = this.allTagMap[tagId]
            return tag.remote_id
          })
        }
      }
    },

    createPromise (data, type) {
      if (type === 'folder') {
        return new Promise ((resolve, reject) => {
          pushNotebook(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'doc') {
        return new Promise ((resolve, reject) => {
          pushNote(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'tag') {
        return new Promise((resolve, reject) => {
          createTag(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      }
    },

    async runPushTasks (foldersNeedPushByDepth, foldersNeedPush, docsNeedPush) {
      let tagPromises = null
      if (this.tagsNeedPush.length > 0) {
        tagPromises = this.createPromise({
          tags: this.tagsNeedPush.map(item => item.name)
        }, 'tag')
      }

      let folderPromises = foldersNeedPushByDepth.map(files => {
        let data = files.map(file => {
          return this.tranData(file)
        })
        return this.createPromise(data, 'folder')
      })

      let docPromises = this.createPromise(
        docsNeedPush.map(file => {
          return this.tranData(file, 'doc')
        })
      , 'doc')

      let tagRes = []
      if (tagPromises) {
        tagRes = await tagPromises
      }

      this.tagsNeedPush.forEach((item, index) =>{
        this.UPDATE_TAG({
          id: item._id,
          data: {
            remote_id: tagRes[index].tagId
          }
        })
      })

      let noteBookRes = await pReduce(folderPromises, async (total, res) => {
        if (total === 0) {
          total = []
        }
        console.log('folderPromises-res', res)
        return [...total, ...res]
      }, 0)

      foldersNeedPush.forEach((item, index) => {
        this.SET_FILE_PUSH_FINISHED({
          id: item.id,
          remote_id: noteBookRes[index].noteBookId
        })
      })

      let noteRes = await docPromises
      
      docsNeedPush.forEach((item, index) => {
        this.SET_FILE_PUSH_FINISHED({
          id: item.id,
          remote_id: noteRes[index].noteBookId
        })
      })

      this.SET_IS_SYNCING(false)
      return [tagRes, noteBookRes, noteRes]
    },

    pushData () {
      console.log('pushData')
      return new Promise((resolve, reject) => {
        console.log('pushData-1111')
        let foldersNeedPush = this.filesNeedPush
          .filter(item => item.type === 'folder')
          .sort((a, b) => a.depth - b.depth)
  
        let foldersNeedPushByDepth = []
  
        let docsNeedPush = this.filesNeedPush
          .filter(item => item.type === 'doc')
        console.log('pushData-2222')
        if (foldersNeedPush.length + docsNeedPush.length === 0) resolve()
        console.log('syncData', foldersNeedPush, docsNeedPush)
        this.SET_IS_SYNCING(true)
        if (foldersNeedPush.length > 0) {
          let minDepth = foldersNeedPush[0].depth
          let maxDepth = foldersNeedPush[foldersNeedPush.length - 1].depth
    
          for (let i = minDepth; i <= maxDepth; i++) {
            let arr = foldersNeedPush.filter(item => item.depth === i)
            if (arr.length > 0) {
              foldersNeedPushByDepth.push(arr)
            }
          }
        }
  
        let resps = this.runPushTasks(foldersNeedPushByDepth, foldersNeedPush, docsNeedPush)
        resolve(resps)
      })
    }
  }
}
