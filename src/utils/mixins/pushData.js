// import pReduce from 'p-reduce'
import { readFileSync, createReadStream } from 'fs'
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import {
  pushNotebook,
  pushNote,
  createTag,
  modifyTag,
  deleteTag,
  uploadFile
} from '@/service'
import LocalDAO from '../../../db/api'
import { saveAppConf } from '@/tools/appConf'

const mimes = ['image/png', 'image/gif','image/jpeg']
let allTagRemoteMap = {}

export default {
  computed: {
    ...mapGetters({
      noteVer: 'GET_NOTE_VER',
      isSyncing: 'GET_IS_SYNCING'
    })
  },

  created () {
    this.hookMsgHandler()
  },

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
      'SET_NOTE_VER',
      'SET_FILE_PUSH_FINISHED'
    ]),

    tranData (file) {
      if (file.type === 'folder') {
        return {
          noteBookId: file.remote_id || file.id,
          parentId: file.remote_pid || file.pid,
          seq: file.seq,
          title: file.title,
          trash: file.trash
        }
      } else if (file.type === 'note') {
        return {
          noteBookId: file.remote_pid || file.pid,
          noteContent: file.content || '',
          noteId: file.remote_id || file.id,
          title: file.title,
          trash: file.trash,
          top: file.top,
          tagId: file.tags.map(item => allTagRemoteMap[item]),
          usn: file.usn
        }
      } else if (file.type === 'tag') {
        return {
          tagsId: file.remote_id,
          tagsName: file.name
        }
      }
    },

    async hookMsgHandler () {
      ipcRenderer.on('fetch-local-data-response', (event, arg) => {
        if (arg.from === 'pushImgs') {
          console.log('pushImgs-res', arg)
          if (arg.tasks.indexOf('getAllLocalImage') > -1) {
            console.log('pushImgs', arg.res)
            this.runPushImgs(arg.res[0]).catch(err => this.pushTags())
          }
          if (arg.tasks.indexOf('updateLocalDocImg') > -1) {
            console.log('updateLocalDocImg-res', arg.res)
            this.pushTags()
          }
        }
        if (arg.from === 'pushTags') {
          if (arg.tasks.indexOf('getAllLocalTag') > -1) {
            console.log('pushTags-allTags', arg.res)
            this.runPushTags(arg.res[0]).then(() => {
              this.pushFolders()
            })
          }
        }
        if (arg.from === 'pushFolders') {
          if (arg.tasks.indexOf('getAllLocalFolderByQuery') > -1) {
            console.log('pushFolders', arg.res)
            this.runPushFolders(arg.res[0]).then(() => {
              console.log('runPushFolders-res')
              this.pushNotes()
            })
          }
        }
        if (arg.from === 'pushNotes') {
          console.log('pushNotes-res', arg)
          if (arg.tasks.indexOf('getAllLocalNoteByQuery') > -1) {
            console.log('pushNotes', arg.res)
            this.runPushNotes(arg.res[0])
            this.SET_IS_SYNCING(false)
          }
          if (arg.tasks[0] === 'updateMultiLocalNote' &&
            arg.tasks[1] === 'removeAllDeletedNote') {
            // this.$Message.success('同步成功')
            this.SET_IS_SYNCING(false)
          }
        }
      })
    },

    pushTags () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalTag'],
        from: 'pushTags'
      })
    },

    pushFolders () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalFolderByQuery'],
        params: [{ query: {} }],
        from: 'pushFolders'
      })
    },

    pushNotes () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalNoteByQuery'],
        params: [{ query: { need_push: true }, with_doc: true }],
        from: 'pushNotes'
      })
    },

    pushImgs () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalImage'],
        from: 'pushImgs'
      })
    },

    async runPushTags (allTags) {
      allTagRemoteMap = {}
      allTags.forEach(item => {
        allTagRemoteMap[item._id] = item.remote_id
      })

      let tNeedPush = allTags.filter(item => item.need_push)
      if (tNeedPush.length === 0) {
        return new Promise((resolve, reject) => {
          resolve()
        })
      }

      // modify tag
      let tModify = tNeedPush.filter(tag => tag.remote_id)
      let tModifyData = tModify.map(tag => this.tranData(tag))
      let modifyP = tModifyData.map(item => {
        return modifyTag(item)
      })
      let modifyResp = await Promise.all(modifyP)

      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateMultiLocalTag'],
        params: [tModify.map(item => {
          return {
            id: item._id,
            need_push: false
          }
        })],
        from: 'pushFolders'
      })

      // let saveModifyTask = modifyResp.map((tag, idx) => {
      //   return LocalDAO.tag.update({
      //     id: tModify[idx]._id,
      //     need_push: false
      //   })
      // })
      // await Promise.all(saveModifyTask)

      // create tag
      let tCreate = tNeedPush.filter(tag => !tag.remote_id)
      if (tCreate.length === 0) {
        return new Promise((resolve, reject) => {
          resolve()
        })
      }
      let tCreateData = tCreate.map(tag => tag.name)
      let createResp = await createTag({
        tags: tCreateData
      })
      console.log('createResp', createResp)
      
      // // update note tag ids to remote_id
      let saveCreateData = createResp.data.body.map((tag, idx) => {
        allTagRemoteMap[tCreate[idx]._id] = tag.tagId
        return {
          id: tCreate[idx]._id,
          remote_id: tag.tagId,
          need_push: false
        }
      })
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateMultiLocalTag'],
        params: [saveCreateData],
        from: 'pushFolders'
      })

      return new Promise((resolve, reject) => {
        resolve()
      })
    },
    
    async runPushFolders (fNeedPush) {
      const _self = this
      return new Promise ((resolve, reject) => {
        if (fNeedPush.length === 0) {
          this.SET_IS_SYNCING(false)
          resolve()
          return
        }
        let { fDepthed, fSorted } = this.getFoldersPrepared(fNeedPush)
        let fDepthedTransed = fDepthed.map((files, index) => {
          return files.map(file => {
            return this.tranData(file)
          })
        })
    
        let taskCol = 0
        function runTask () {
          console.log('runTask', taskCol, fDepthedTransed)
          if (taskCol >= fDepthedTransed.length) {
            console.log('runTask-1111')
            ipcRenderer.send('fetch-local-data', {
              tasks: ['removeAllDeletedFolder'],
              from: 'pushFolders'
            })
            resolve()
            return
          } else {
            pushNotebook(fDepthedTransed[taskCol]).then(resp => {
              if (resp.data.returnCode === 200) {
                let fileResolved = resp.data.body
                let saveFolderData = fileResolved.map((file, idx) => {
                  return {
                    id: fDepthed[taskCol][idx]._id,
                    remote_id: file.noteBookId,
                    remote_pid: file.parentId,
                    need_push: false
                  }
                })
                ipcRenderer.send('fetch-local-data', {
                  tasks: ['updateMultiLocalFolder'],
                  params: [saveFolderData],
                  from: 'pushFolders'
                })
      
                if (fDepthedTransed[taskCol + 1]) {
                  fDepthedTransed[taskCol + 1].forEach(file => {
                    let pFileIdx = _.findIndex(fDepthed[taskCol], { _id: file.parentId })
                    if (pFileIdx > -1) {
                      file.parentId = fileResolved[pFileIdx].noteBookId
                    }
                  })
                }
                taskCol++
                runTask()
              } else {
                _self.$Message.error(resp.data.returnMsg)
                if (resp.data.returnCode === 403) {
                  saveAppConf(_self.$remote.app.getAppPath('appData'), {
                    user: null
                  })
                  ipcRenderer.send('changeWindow', {
                    name: 'login'
                  })
                }
              }
            }).catch(err => {
              saveAppConf(_self.$remote.app.getAppPath('appData'), {
                user: null
              })
              ipcRenderer.send('changeWindow', {
                name: 'login'
              })
              reject(err)
            })
          }
        }
    
        runTask()
        // this.$Message.success('同步成功')
      })
    },

    async runPushNotes (nNeedPush) {
      if (nNeedPush.length === 0) {
        this.SET_IS_SYNCING(false)
        return
      }
      let nTransed = nNeedPush.map(note => {
        return this.tranData(note)
      })

      let resp = await pushNote(nTransed)

      if (resp.data.returnCode === 200) {
        let noteResolved = resp.data.body
        if (noteResolved.length > 0) {
          let usnMax = Math.max(noteResolved.map(item => item.usn))
          if (usnMax > this.noteVer) {
            this.SET_NOTE_VER(usnMax)
            ipcRenderer.send('fetch-local-data', {
              tasks: ['updateState'],
              params: [{
                note_ver: noteResolved[0].usn
              }],
              from: 'pushNotes'
            })
          }
        }

        let saveNoteData = noteResolved.map((file, index) => {
          return {
            id: nNeedPush[index]._id,
            usn: file.usn,
            remote_id: file.noteId,
            need_push: false
          }
        })
        console.log('saveNoteData', saveNoteData)
        ipcRenderer.send('fetch-local-data', {
          tasks: ['updateMultiLocalNote', 'removeAllDeletedNote'],
          params: [saveNoteData],
          queue: true,
          from: 'pushNotes'
        })
      } else {
        this.$Message.error(resp.data.returnMsg)
      }
    },

    async runPushImgs (iNeedPush) {
      console.log('pushImgs-allImgs', iNeedPush)
      if (iNeedPush.length === 0) {
        this.pushTags()
      }
      let docsNeedSave = []
      let imgResp = await Promise.all(
        iNeedPush.filter(img => mimes.indexOf(img.mime) > -1 && img.path)
      .map(img => {
        let buffer = readFileSync(img.path.replace('file:///', ''))
        let blob = new Blob([buffer])
        let file = new window.File([blob], img.name, {type: img.mime})
        return uploadFile(file).then(res => {
          docsNeedSave.push({
            note_id: img.note_id,
            img: {
              path: img.path,
              id: img._id,
              url: res.data.body[0].url
            }
          })
        }).catch(err => {
          return
        })
        // return this.createPromise({
        //   img: img,
        //   file: file
        // }, 'img')
      })).catch(err => {
        return
      })
      console.log('imgResp', imgResp)
      ipcRenderer.send('fetch-local-data', {
        tasks: ['updateLocalDocImg'],
        params: [docsNeedSave],
        from: 'pushImgs'
      })
    },

    async pushData () {
      this.SET_IS_SYNCING(true)
      this.pushImgs()
    },

    getFoldersPrepared (fNeedPush) {
      let fDepthed = []
      let fSorted = []
      let folderMap = this.$root.$navTree.model.store.map

      fNeedPush.forEach(folder => {
        let depth = folderMap[folder._id] ? folderMap[folder._id].getDepth() : 0
        let index = folderMap[folder._id] ? folderMap[folder._id].getIndex() : 0
        folder.depth = depth
        folder.seq = index
      })

      fSorted = fNeedPush.sort((a, b) => a.depth - b.depth)

      if (fSorted.length > 0) {
        let minDepth = fSorted[0].depth
        let maxDepth = fSorted[fSorted.length - 1].depth
  
        for (let i = minDepth; i <= maxDepth; i++) {
          let arr = fSorted.filter(item => item.depth === i)
          if (arr.length > 0) {
            fDepthed.push(arr)
          }
        }
      }
      return {
        fDepthed: fDepthed.filter(arr => arr.length > 0),
        fSorted: fSorted
      }
    }
  }
}
