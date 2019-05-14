// import { folderDB } from './index.js'
import { getValid } from '../tools'
import folderModel from '../models/folder'
import { LinvoDB } from '../index'
import noteCtr from './note'

let Folder = {}

function createCollection (path) {
  LinvoDB.dbPath = path

  Folder = new LinvoDB('folder', {
    type: {
      type: String,
      default: 'folder'
    },
    remote_id: {
      type: String
    },
    pid: {
      type: String,
      default: '0'
    },
    remote_pid: {
      type: String
    },
    title: {
      type: String,
      default: '新建文件夹'
    },
    seq: {
      type: Number,
      default: 0
    },
    create_at: Date,
    update_at: Date,
    trash: {
      type: String,
      default: 'NORMAL'
    },
    need_push: {
      type: Boolean,
      default: true
    },
    tags: [String],
    top: {
      type: Boolean,
      default: false
    }
  })
}

function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Folder.save(data, (err, folders) => {
      resolve(folders)
    })
  })
}

// add
function add (req) {
  let data = folderModel(req)
  
  return new Promise((resolve, reject) => {
    getById({ id: req.pid }).then(pFolder => {
      if (pFolder && pFolder.remote_id) {
        data.remote_pid = pFolder.remote_id
      }
      Folder.insert(data, function (err, folders) {
        if (err) {
          reject(err)
        }
        resolve(folders)
      })
    })
  })
}

function diffAdd (req) {
  console.log('diffAdd', req)
  return new Promise((resolve, reject) => {
    Folder.findOne({ remote_id: req.remote_id }, (err, folder) => {
      console.log('diffAdd-1111', folder)
      if (folder) {
        req.id = folder._id
        update(req).then(res => {
          console.log('diffAdd-2222', res)
          resolve(res)
        })
      } else {
        add(req).then(res => {
          console.log('diffAdd-3333', res)
          resolve(res)
        })
      }
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Folder.find({}, (err, folders) => {
      folders.forEach(folder => {
        folder.remove()
      })
      resolve(folders.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Folder.findOne({ _id: id }, (err, folder) => {
      folder.remove()
      resolve()
    })
  })
}

function removeAllDeleted () {
  console.log('removeAllDeleted')
  return new Promise((resolve, reject) => {
    Folder.find({ trash: 'DELETED' }, (err, folders) => {
      let p = folders.map(folder => {
        return new Promise((resolve, reject) => {
          folder.remove()
          resolve()
        })
      })
      Promise.all(p).then(() => {
        console.log('removeAllDeleted-res', p)
        resolve(p.length)
      })
    })
  })
}

function deleteAll () {
  return new Promise((resolve, reject) => {
    Folder.find({}).exec((err, folders) => {
      let p = folders.map(folder => {
        return update({
          id: folder._id,
          trash: 'DELETED'
        })
      })
      Promise.all(p).then(() => {
        // removeAll().then(() => {
          resolve(folders.length)
        // })
      })
    })
  })
}

// update
async function update (req) {
  console.log('update', req)
  const { id } = req

  if (!req.hasOwnProperty('need_push')) {
    req.need_push = true
  }

  if (req.hasOwnProperty('pid')) {
    let folder = await getById({ id: req.pid })
    req.remote_pid = folder ? folder.remote_id : '0'
  }

  return new Promise((resolve, reject) => {
    Folder.findOne({ _id: id })
    .exec((err, folder) => {
      if (!folder) {
        updateByQuery({
          query: { remote_id: id },
          data: req
        }).then((res) => {
          resolve(res)
        })
        return
      }
      let old_remote_id = folder.remote_id
      let old_trash = folder.trash
      
      Folder.update(
        { _id: id },
        { $set: req},
        { multi: true },
        (err, num, newFolder) => {
          let childData = {}
          if (req.trash === 'DELETED') {
            childData.trash = 'DELETED'
          }
          if (newFolder.remote_id !== old_remote_id) {
            childData.remote_pid = newFolder.remote_id
          }
          if (childData.hasOwnProperty('trash') || childData.hasOwnProperty('remote_pid')) {
            updateByQuery({
              query: { pid: newFolder._id },
              data: childData
            }).then(() => {
              noteCtr.updateByQuery({
                query: { pid: newFolder._id },
                data: childData
              }).then(() => {
                if (req.trash === 'NORMAL' && old_trash !== newFolder.trash) {
                  console.log('update-p', newFolder)
                  update({
                    id: newFolder.pid,
                    trash: 'NORMAL'
                  }).then(() => {
                    resolve(newFolder)
                  })
                } else {
                  resolve(newFolder)
                }
              })
            })
          } else {
            resolve(newFolder)
          }
        }
      )
    })
  })
}

function updateByQuery (req) {
  const { query, data } = req
  data.need_push = true
  console.log('updateByQuery', query ,data)

  return new Promise((resolve, reject) => {
    Folder.find(query, (err, folders) => {
      let p = folders.map(folder => {
        let r = {}
        for (let i in data) {
          r[i] = data[i]
        }
        r.id = folder._id
        return update(r)
      })
      Promise.all(p).then(res => {
        console.log('update-folder-by-query-111', res)
        resolve(res)
      })
    })
  })
}

function updateMulti (reqs) {
  return new Promise((resolve, reject) => {
    let p = reqs.map(req => {
      return update(req)
    })
    Promise.all(p).then(res => {
      resolve(res)
    })
  })
}

// get
function getAll () {
  console.log('getAll-folder')
  return new Promise((resolve, reject) => {
    Folder.find({}, (err, folders) => {
      let p = folders.map(folder => {
        return new Promise((resolve, reject) => {
          getById({ id: folder.pid }).then(pFolder => {
            console.log('getAll-1111', folder, pFolder)
            if (!pFolder) {
              console.log('getAll-2222', folder)
              if (folder.remote_pid) {
                Folder.findOne({ remote_id: folder.remote_pid }, (err, p) => {
                  console.log('getAll-3333', p)
                  pFolder = p
                  if (pFolder) {
                    update({ id: folder._id, pid: p._id }).then(() => {
                      folder.folder_title = pFolder.title
                      folder.pid = p._id
                      resolve(folder)
                    })
                  } else {
                    if (folder.pid !== '0') {
                      update({ id: folder._id, pid: '0' }).then(() => {
                        folder.folder_title = '我的文件夹'
                        folder.pid = '0'
                        resolve(folder)
                      })
                    } else {
                      folder.folder_title = '我的文件夹'
                      resolve(folder)
                    }
                  }
                })
              } else {
                if (folder.pid !== '0') {
                  update({ id: folder._id, pid: '0' }).then(() => {
                    folder.folder_title = '我的文件夹'
                    folder.pid = '0'
                    resolve(folder)
                  })
                } else {
                  folder.folder_title = '我的文件夹'
                  resolve(folder)
                }
              }
            } else {
              folder.folder_title = pFolder.title
              resolve(folder)
            }
          })
        })
      })
      Promise.all(p).then(res => {
        resolve(res)
      })
    })
  })
}

function getAllByQuery (req) {
  const { query } = req
  console.log('getAllByQuery', req, query)

  return new Promise((resolve, reject) => {
    Folder.find(query, (err, folders) => {
      resolve(folders)
    })
  })
}

function getAllByPid (req) {
  const { pid, remote_pid } = req
  console.log('getAllByPid', pid)

  return new Promise((resolve, reject) => {
    getById({ id: pid }).then(pFolder => {
      let folder_title = pFolder ? pFolder.title : '我的文件夹'
      if (remote_pid) {
        Folder.find({ remote_pid: remote_pid }, (err, folders) => {
          if (Object.prototype.toString.call(folders) === `[object Array]`) {
            folders.forEach(folder => {
              folder.folder_title = folder_title
            })
          } else {
            if (folders) {
              folders.folder_title = folder_title
            }
          }
          resolve(folders)
        })
      } else {
        Folder.find({ pid: pid }, (err, folders) => {
          if (Object.prototype.toString.call(folders) === `[object Array]`) {
            folders.forEach(folder => {
              folder.folder_title = folder_title
            })
          } else {
            if (folders) {
              folders.folder_title = folder_title
            }
          }
          resolve(folders)
        })
      }
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Folder.findOne({ _id: id }, (err, folder) => {
      resolve(folder)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Folder.find({ trash: 'TRASH' }, (err, folders) => {
      resolve(folders)
    })
  })
}

export default {
  createCollection,
  saveAll,
  add,
  diffAdd,
  removeAll,
  removeById,
  removeAllDeleted,
  deleteAll,
  update,
  updateByQuery,
  updateMulti,
  getAll,
  getAllByQuery,
  getAllByPid,
  getById,
  getTrash
}
