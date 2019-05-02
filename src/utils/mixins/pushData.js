import pReduce from 'p-reduce'
import { mapGetters, mapActions } from 'vuex'
import { pushNotebook, pushNote, createTag, deleteTag, uploadFile } from '@/service'
import LocalDAO from '../../../db/api'
import { readFileSync, createReadStream, unlinkSync } from 'fs'

const mimes = ['image/png', 'image/gif','image/jpeg']

export default {
  data () {
    return {
    }
  },

  computed: {
    ...mapGetters({
      // allFileMap: 'GET_FILES',
      allTagMap: 'GET_TAGS_MAP',
      isSyncing: 'GET_IS_SYNCING',
      tagsNeedPush: 'GET_TAGS_NEED_PUSH',
      filesNeedPush: 'GET_FILES_NEED_PUSH'
    })
  },

  mounted () {
    console.log('mounted-11111111', this.$root)
  },

  methods: {
    ...mapActions([
      'SET_IS_SYNCING',
      'SET_FILE_PUSH_FINISHED'
    ]),

    tranData (file) {
      // let parentFolder = this.allFileMap[file.parent_folder]

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
          tagId: [],
          // tagId: file.tags.map(tagId => {
          //   let tag = this.allTagMap[tagId]
          //   return tag ? tag.remote_id : undefined
          // }).filter(tag => tag)
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

    async runPushTasks (fDepthed, fSorted, nNeedPush) {
      console.log('runPushTasks', fDepthed, fSorted, nNeedPush)
      let tagTrashPromises = null
      // if (tagsNeedDelete.length > 0) {
      //   tagTrashPromises = this.createPromise({
      //     tags: tagsNeedDelete.map(item => item.remote_id)
      //   }, 'deleteTag')
      // }

      // let tagPromises = null
      // if (this.tagsNeedPush.length > 0) {
      //   tagPromises = this.createPromise({
      //     tags: this.tagsNeedPush.map(item => item.name)
      //   }, 'tag')
      // }

      let fPromises = fDepthed.map(files => {
        let data = files.map(file => {
          return this.tranData(file)
        })
        return this.createPromise(data, 'folder', files)
      })

      let nPromises = this.createPromise(
        nNeedPush.map(file => {
          return this.tranData(file)
        })
      , 'doc')

      // let deleteTagRes = []
      // if (tagTrashPromises) {
      //   deleteTagRes = await tagTrashPromises
      // }

      // let tagRes = []
      // if (tagPromises) {
      //   tagRes = await tagPromises
      // }

      // await Promise.all(tagsNeedDelete.map(tag => {
      //   return LocalDAO.tag.removeById({
      //     id: tag._id
      //   })
      // }))

      // this.tagsNeedPush.forEach((item, index) =>{
      //   this.UPDATE_TAG({
      //     id: item._id,
      //     data: {
      //       remote_id: tagRes[index].tagId
      //     }
      //   })
      // })

      // push folder
      let fRes = await pReduce(fPromises, async (total, res) => {
        if (total === 0) {
          total = []
        }
        console.log('fPromises-res', res)
        return [...total, ...res]
      }, 0)

      console.log('fRes', fRes)

      // fSorted.forEach((item, index) => {
        // this.SET_FILE_PUSH_FINISHED({
        //   id: item.id,
        //   remote_id: noteBookRes[index].noteBookId
        // })
      // })

      // push note
      let nRes = await nPromises

      console.log('nRes', nRes)
      
      // nNeedPush.forEach((item, index) => {
        // this.SET_FILE_PUSH_FINISHED({
        //   id: item.id,
        //   remote_id: nRes[index].noteId
        // })
      // })

      // let deleteFilePromise = this.filesNeedPush.filter(file => file.trash === 'DELETE')
      //   .map(file => {
      //     return LocalDAO.files.removeById({
      //       id: file.id
      //     })
      //   })

      // await Promise.all(deleteFilePromise)

      this.SET_IS_SYNCING(false)
      return [fRes, nRes]
    },

    async pushFolders () {
      console.log('pushFolders-111111')
      let fNeedPush = await LocalDAO.folder.getAllByQuery({
        query: {
          need_push: true
        }
      })
      let { fDepthed, fSorted } = this.getFoldersPrepared(fNeedPush)
      
      let fDepthedTransed = fDepthed.map((files, index) => {
        return files.map(file => {
          return this.tranData(file)
        })
      })

      console.log('fNeedPush', fNeedPush)
      console.log('fDepthed', fDepthed)
      console.log('fSorted', fSorted)
      console.log('fDepthedTransed', fDepthedTransed)
      let taskCol = 0

      function runTask () {
        console.log('runTask', taskCol)
        if (taskCol >= fDepthedTransed.length) return
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
                seq: file.seq,
                title: file.title,
                trash: file.trash,
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
        })
      }

      runTask()

      // let fPromises = fDepthedTransed.map((files, index) => {
      //   return new Promise ((resolve, reject) => {
      //     pushNotebook(fDepthedTransed[index]).then(resp => {
      //       console.log('222222', index, fDepthedTransed[index])
      //       if (resp.data.returnCode === 200) {
      //         let fileResolved = resp.data.body
      //         console.log('fileResolved', fileResolved)
      //         if (fDepthedTransed[index + 1]) {
      //           fDepthedTransed[index + 1].forEach(file => {
      //             let pFileIdx = _.findIndex(fDepthed[index], { _id: file.parentId })
      //             if (pFileIdx > -1) {
      //               file.parentId = fileResolved[pFileIdx].noteBookId
      //             }
      //             console.log('fileResolved-111', file, pFileIdx, file.parentId)
      //           })
      //         }
      //         resolve(resp.data.body)
      //       } else {
      //         this.SET_IS_SYNCING(false)
      //         reject(resp.data.returnMsg)
      //       }
      //     })
      //   })
      // })
      // let fRes = await pReduce(fPromises, async (total, res) => {
      //   if (total === 0) {
      //     total = []
      //   }
      //   console.log('fPromises-res', res)
      //   return [...total, ...res]
      // }, 0)
    },

    async pushData () {
      return await this.pushFolders()
      return
      // folder
      let fNeedPush = await LocalDAO.folder.getAllByQuery({
        query: {
          need_push: true
        }
      })
      let { fDepthed, fSorted } = this.getFoldersPrepared(fNeedPush)

      // note
      let nNeedPush = await LocalDAO.note.getAllByQuery({
        query: {
          need_push: true
        }
      })
      console.log('fNeedPush', fNeedPush)
      console.log('fDepthed', fDepthed)
      console.log('fSorted', fSorted)
      console.log('nNeedPush', nNeedPush)
      let resp = this.runPushTasks(fDepthed, fSorted, nNeedPush)
      return resp
      // return new Promise((resolve, reject) => {
      //   resolve()
      //   return
      //   LocalDAO.tag.getAllTrash().then(trashTagResp => {
      //     let tagsNeedDelete = trashTagResp.filter(item => item.remote_id)
      //     // tagsNeedDelete = []
      //     if (this.filesNeedPush.length + tagsNeedDelete.length === 0) {
      //       console.log('no-file-need-push')
      //       resolve()
      //       return
      //     }
      //     let fNeedPush = this.filesNeedPush
      //       .filter(item => item.type === 'folder')
      //       .sort((a, b) => a.depth - b.depth)
    
      //     let fDepthed = []
    
      //     let docsNeedPush = this.filesNeedPush
      //       .filter(item => item.type === 'doc')
      //     // if (fNeedPush.length + docsNeedPush.length === 0) {
      //     //   console.log('pushData', fNeedPush.length, docsNeedPush.length)
      //     //   resolve()
      //     // }
      //     console.log('syncData', fNeedPush, docsNeedPush)
      //     this.SET_IS_SYNCING(true)
      //     if (fNeedPush.length > 0) {
      //       let minDepth = fNeedPush[0].depth
      //       let maxDepth = fNeedPush[fNeedPush.length - 1].depth
      
      //       for (let i = minDepth; i <= maxDepth; i++) {
      //         let arr = fNeedPush.filter(item => item.depth === i)
      //         if (arr.length > 0) {
      //           fDepthed.push(arr)
      //         }
      //       }
      //     }
    
      //     let resps = this.runPushTasks(tagsNeedDelete, fDepthed, fNeedPush, docsNeedPush)
      //     resolve(resps)
      //   })
      // })
    },

    getFoldersPrepared (fNeedPush) {
      let fDepthed = []
      let fSorted = []
      let folderMap = this.$root.$navTree.model.store.map

      fNeedPush.forEach(folder => {
        let depth = folderMap[folder._id].getDepth()
        folder.depth = folderMap[folder._id].getDepth()
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
        fDepthed: fDepthed,
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
