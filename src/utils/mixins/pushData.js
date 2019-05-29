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
import fetchLocal from '../fetchLocal'
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

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
      'SET_FILE_PUSH_FINISHED'
    ]),

    async pushData () {
      if (this.isSyncing) return
      this.SET_IS_SYNCING(true)
      await this.pushImgs()
      await this.pushTags()
      await this.pushFolders()
      await this.pushNotes()
      setTimeout(() => {
        this.SET_IS_SYNCING(false)
      }, 1000)
    },

    async pushImgs () {
      let iNeedPush = await fetchLocal('getAllLocalImage')

      if (iNeedPush.length === 0) {
        return []
      }
      let docsNeedSave = []
      let imgResp = await Promise.all(iNeedPush.filter(img => mimes.indexOf(img.mime) > -1 && img.path).map(img => {
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
      })).catch(err => {
        return
      })

      await fetchLocal('updateLocalDocImg', docsNeedSave)

      return imgResp
    },

    async pushTags () {
      let allTags = await fetchLocal('getAllLocalTagByQuery', {})

      allTagRemoteMap = {}
      allTags.forEach(item => {
        allTagRemoteMap[item._id] = item.remote_id
      })

      let tNeedPush = allTags.filter(item => item.need_push)
      if (tNeedPush.length === 0) {
        return []
      }

      // modify tag
      let tModify = tNeedPush.filter(tag => tag.remote_id && tag.trash === 'NORMAL')
      let tModifyData = tModify.map(tag => this.tranData(tag))
      let modifyP = tModifyData.map(item => {
        return modifyTag(item)
      })
      let modifyResp = await Promise.all(modifyP)
      let t = tModify.map(item => {
        return {
          id: item._id,
          need_push: false
        }
      })

      await fetchLocal('updateMultiLocalTag', t)

      // delete tag
      let tDelete = tNeedPush.filter(tag => tag.trash === 'DELETED' && tag.remote_id)

      let tDeleteData = tDelete.map(tag => tag.remote_id)

      let deleteResp
      if (tDeleteData.length > 0) {
        deleteResp = await deleteTag({ tags: tDeleteData })
      }

      let deleteP = tDeleteData.map(item => {
        return fetchLocal('removeLocalTag', {
          remote_id: item
        })
      })
      let deleteLocalResp = await Promise.all(deleteP)

      // create tag
      let tCreate = tNeedPush.filter(tag => !tag.remote_id)
      if (tCreate.length === 0) {
        return []
      }
      let tCreateData = tCreate.map(tag => tag.name)
      let createResp = await createTag({
        tags: tCreateData
      })
      
      // // update note tag ids to remote_id
      let saveCreateData = createResp.data.body.map((tag, idx) => {
        allTagRemoteMap[tCreate[idx]._id] = tag.tagId
        return {
          id: tCreate[idx]._id,
          remote_id: tag.tagId,
          need_push: false
        }
      })
      await fetchLocal('updateMultiLocalTag', saveCreateData)
    },
    
    async pushFolders () {
      const _self = this
      let fNeedPush = await fetchLocal('getAllLocalFolder')

      if (fNeedPush.length === 0) {
        return []
      }

      let { fDepthed, fSorted } = this.getFoldersPrepared(fNeedPush)
      let fDepthedTransed = fDepthed.map((files, index) => {
        return files.map(file => {
          return this.tranData(file)
        })
      })

      let taskCol = 0

      async function runTask () {
        if (taskCol >= fDepthedTransed.length) {
          let localFoldersRemoved = await fetchLocal('removeAllDeletedFolder')
          return
        } else {
          let resp = await pushNotebook(fDepthedTransed[taskCol])
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
            await fetchLocal('updateMultiLocalFolder', saveFolderData)
  
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
            }
          }
        }
      }

      runTask()
    },

    async pushNotes () {
      let nNeedPush = await fetchLocal('getLocalNoteByQuery',
        { need_push: true },
        { multi: true, with_doc: true }
      )

      if (nNeedPush.length === 0) {
        return
      }

      let nTransed = nNeedPush.map(note => {
        return this.tranData(note)
      })

      let resp = await pushNote(nTransed)

      if (resp.data.returnCode === 200) {
        let noteResolved = resp.data.body
        if (noteResolved.length > 0) {
          let usnArr = noteResolved.map(item => item.usn)
          let usnMax = Math.max(...usnArr)
          if (usnMax > this.noteVer) {
            await fetchLocal('updateState', {
              note_ver: usnMax
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
        await fetchLocal('updateMultiLocalNote', saveNoteData)
        await fetchLocal('removeAllDeletedNote')
      } else {
        this.$Message.error(resp.data.returnMsg)
      }
    },

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
