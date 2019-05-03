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

// update
async function update (req) {
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
      let old_remote_id = folder.remote_id
      console.log('update-000-000', req, folder, old_remote_id)
      
      Folder.update(
        { _id: id },
        { $set: req},
        { multi: true },
        (err, num, newFolder) => {
          console.log('update-folder-111', newFolder)
          if (newFolder.remote_id !== old_remote_id) {
            console.log('update-folder-222', newFolder)
            updateByQuery({
              query: { pid: newFolder._id },
              data: { remote_pid: newFolder.remote_id }
            }).then(() => {
              noteCtr.updateByQuery({
                query: { pid: newFolder._id },
                data: { remote_pid: newFolder.remote_id }
              }).then(() => {
                resolve(newFolder)
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
    Folder.update(
      query,
      { $set: data },
      { multi: true },
      (err, num, newFolder) => {
        console.log('update-folder-by-query-111', newFolder)
        resolve(newFolder)
      }
    )
  })
}

// get
function getAll () {
  console.log('getAll-folder')
  return new Promise((resolve, reject) => {
    Folder.find({ trash: 'NORMAL' }, (err, folders) => {
      resolve(folders)
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

  if (remote_pid) {
    return new Promise((resolve, reject) => {
      Folder.find({ remote_pid: remote_pid }, (err, folders) => {
        resolve(folders)
      })
    })
  } else {
    return new Promise((resolve, reject) => {
      Folder.find({ pid: pid }, (err, folders) => {
        resolve(folders)
      })
    })
  }

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
  removeAll,
  removeById,
  update,
  getAll,
  getAllByQuery,
  getAllByPid,
  getById,
  getTrash
}
