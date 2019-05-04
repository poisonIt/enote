// import pReduce from 'p-reduce'
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import { pushNotebook, pushNote, createTag, modifyTag, deleteTag, uploadFile } from '@/service'
import LocalDAO from '../../../db/api'
import { readFileSync, createReadStream, unlinkSync } from 'fs'

const mimes = ['image/png', 'image/gif','image/jpeg']
let allTagRemoteMap = {}

export default {
  computed: {
    ...mapGetters({
      isSyncing: 'GET_IS_SYNCING'
    })
  },

  created () {
    this.hookMsgHandler()
  },

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
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
        console.log('doc-push', file)
        return {
          noteBookId: file.remote_pid || file.pid,
          noteContent: file.content || '',
          noteId: file.remote_id || file.id,
          title: file.title,
          trash: file.trash,
          top: file.top,
          tagId: file.tags.map(item => allTagRemoteMap[item])
        }
      } else if (file.type === 'tag') {
        return {
          tagsId: file.remote_id,
          tagsName: file.name
        }
      }
    },

    createPromise (data, type, rawData) {
      if (type === 'folder') {
        return new Promise ((resolve, reject) => {
          pushNotebook(data).then(resp => {
            if (resp.data.returnCode === 200) {
              let dataResp = resp.data.body
              let updateRIDPromises = rawData.map((file, index) => {
                if (!file.remote_id) {
                  return LocalDAO.folder.update({
                    id: file._id,
                    remote_id: dataResp[index].noteBookId
                  })
                } else {
                  return false
                }
              }).filter(p => p)

              Promise.all(updateRIDPromises).then(() => {
                resolve(resp.data.body)
              })
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'note') {
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
      } else if (type === 'deleteTag') {
        return new Promise((resolve, reject) => {
          console.log('deleteTag-data', data)
          deleteTag(data).then(resp => {
            if (resp.data.returnCode === 200) {
              resolve(resp.data.body)
            } else {
              this.SET_IS_SYNCING(false)
              reject(resp.data.returnMsg)
            }
          })
        })
      } else if (type === 'img') {
        return new Promise((resolve, reject) => {
          uploadFile(data.file).then(resp => {
            LocalDAO.files.getById({
              id: data.img.doc_id
            }).then(doc => {
              let oldContent = doc.content
              console.log('resp', resp)
              let newContent = doc.content.replace(new RegExp(data.img.path,'gm'), resp.data.body[0].url)
              console.log('newContent', newContent)
              LocalDAO.files.update({
                id: data.img.doc_id,
                data: {
                  content: newContent
                }
              }).then(() => {
                LocalDAO.img.removeById({
                  id: data.img._id
                }).then(() => {
                  unlinkSync(data.img.path.replace('file:///', ''))
                  resolve()
                })
              })
            })
          })
        })
      }
    },

    async hookMsgHandler () {
      ipcRenderer.on('fetch-local-data-response', (event, arg) => {
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
          if (arg.tasks.indexOf('getAllLocalNoteByQuery') > -1) {
            console.log('pushNotes', arg.res)
            this.runPushNotes(arg.res[0])
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
        params: [{ query: { need_push: true } }],
        from: 'pushFolders'
      })
    },

    pushNotes () {
      console.log('pushNotes')
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalNoteByQuery'],
        params: [{ query: { need_push: true }, with_doc: true }],
        from: 'pushNotes'
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
        params: [{
          ids: tModify.map(item => item._id),
          need_push: false
        }],
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
      
      let saveCreateTask = createResp.data.body.map((tag, idx) => {
        allTagRemoteMap[tCreate[idx]._id] = tag.tagId
      console.log('allTagRemoteMap-1111', allTagRemoteMap, tCreate[idx]._id, tag.tagId)
        return LocalDAO.tag.update({
          id: tCreate[idx]._id,
          remote_id: tag.tagId,
          need_push: false
        })
      })
      await Promise.all(saveCreateTask)
      console.log('allTagRemoteMap-2222', allTagRemoteMap)

      // // update note tag ids to remote_id
      // createResp.forEach((tag, idx) => {
      //   allTagRemoteMap[tag._id] = item.remote_id
      // })
      // console.log('tagR', tagR)
      // let saveUpdateTask = createResp.map((tag, idx) => {
      //   return LocalDAO.note.updateRemoteTagIds({
      //     tags: tagR
      //   })
      // })
      // await Promise.all(saveUpdateTask)

      return new Promise((resolve, reject) => {
        resolve()
      })
    },
    
    async runPushFolders (fNeedPush) {
      return new Promise ((resolve, reject) => {
        if (fNeedPush.length === 0) {
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
            LocalDAO.folder.removeAllDeleted().then(() => {
              resolve()
              return
            })
          } else {
            pushNotebook(fDepthedTransed[taskCol]).then(resp => {
              console.log('222222', taskCol, fDepthedTransed[taskCol])
              if (resp.data.returnCode === 200) {
                let fileResolved = resp.data.body
                console.log('fileResolved', fileResolved)
                let saveFolderTasks = fileResolved.map((file, idx) => {
                  return LocalDAO.folder.update({
                    id: fDepthed[taskCol][idx]._id,
                    remote_id: file.noteBookId,
                    remote_pid: file.parentId,
                    need_push: false
                  })
                })
      
                Promise.all(saveFolderTasks).then(() => {
                  if (fDepthedTransed[taskCol + 1]) {
                    fDepthedTransed[taskCol + 1].forEach(file => {
                      let pFileIdx = _.findIndex(fDepthed[taskCol], { _id: file.parentId })
                      if (pFileIdx > -1) {
                        file.parentId = fileResolved[pFileIdx].noteBookId
                      }
                      console.log('fileResolved-111', file, pFileIdx, file.parentId)
                    })
                  }
                  taskCol++
                  runTask()
                })
              }
            }).catch(err => {
              reject(err)
            })
          }
        }
    
        runTask()
      })
    },

    async runPushNotes (nNeedPush) {
      if (nNeedPush.length === 0) {
        return
      }
      let nTransed = nNeedPush.map(note => {
        return this.tranData(note)
      })
      console.log('nTransed', nTransed)

      let resp = await pushNote(nTransed)

      if (resp.data.returnCode === 200) {
        let noteResolved = resp.data.body

        let saveNoteTasks = noteResolved.map((file, index) => {
          return LocalDAO.note.update({
            id: nNeedPush[index]._id,
            remote_id: file.noteId,
            need_push: false
          })
        })

        Promise.all(saveNoteTasks).then(res => {
          console.log('saveNoteTasks', res)
          LocalDAO.note.removeAllDeleted().then(() => {
            return
          })
        })
      } else {
        this.SET_IS_SYNCING(false)
        return
      }
    },

    async pushData () {
      this.pushTags()
    },

    getFoldersPrepared (fNeedPush) {
      let fDepthed = []
      let fSorted = []
      let folderMap = this.$root.$navTree.model.store.map

      fNeedPush.forEach(folder => {
        let depth = folderMap[folder._id] ? folderMap[folder._id].getDepth() : 0
        folder.depth = depth
      })

      fSorted = fNeedPush.sort((a, b) => a.depth - b.depth)
      console.log('fNeedPush-2222', fSorted)

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
    },

    async pushImgs () {
      return new Promise((resolve, reject) => {
        LocalDAO.img.getAll().then(allImgs => {
          console.log('pushImgs-allImgs', allImgs)
          Promise.all(allImgs.filter(img => mimes.indexOf(img.mime) > -1 && img.path)
          .map(img => {
            let buffer = readFileSync(img.path.replace('file:///', ''))
            let blob = new Blob([buffer])
            let file = new window.File([blob], img.name, {type: img.mime})
            return this.createPromise({
              img: img,
              file: file
            }, 'img')
          })).then(imgResp => {
            console.log('imgResp', imgResp)
            resolve(imgResp)
          })
          // allImgs.forEach(img => {
          //   if (mimes.indexOf(img.mime) > -1 && img.path) {
          //     console.log('img', img)
          //     let buffer = readFileSync(img.path.replace('file:///', ''))
          //     let blob = new Blob([buffer])
          //     let file = new window.File([blob], img.name, {type: img.mime})
              
          //     uploadFile(file).then(resp => {
          //       LocalDAO.files.getById({
          //         id: img.doc_id
          //       }).then(doc => {
          //         let oldContent = doc.content
          //         let newContent = doc.content.replace(new RegExp(img.path,'gm'), resp.data.body[0].url)
          //         console.log('newContent', newContent)
          //         LocalDAO.files.update({
          //           id: img.doc_id,
          //           data: {
          //             content: newContent
          //           }
          //         }).then(() => {
          //           LocalDAO.img.removeById({
          //             id: img._id
          //           }).then(() => {
          //             unlinkSync(img.path.replace('file:///', ''))
          //             resolve()
          //           })
          //         })
          //       })
          //     })
          //   }
          // })
        })
      })
    }
  }
}
