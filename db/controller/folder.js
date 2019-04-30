import { LinvoDB } from './index.js'
import { getValid } from '../tools'
import folderModel from '../models/folder'

var Folder = new LinvoDB('folder', {
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

// let folder = new Folder({})
// folder.save()
// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Folder.save(data).exec((err, folders) => {
      resolve(folders)
    })
  })
}

// add
function add (req) {
  let data = folderModel(req)

  return new Promise((resolve, reject) => {
    Folder.insert(data, function (err, folders) {
      if (err) {
        reject(err)
      }
      resolve(folders)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Folder.find({}).exec((err, folders) => {
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
    Folder.findOne({ _id: id }).exec((err, folder) => {
      folder.remove()
      resolve()
    })
  })
}

// update
function update (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Folder.findOne({ _id: id })
    .exec((err, folder) => {
      Folder.update(
        { _id: id },
        { $set: req},
        { multi: true },
        (err, newFolder) => {
          console.log('update-folder-111', newFolder)
          resolve(newFolder)
        }
      )
    })
  })
}

// get
function getAll () {
  console.log('getAll-folder')
  return new Promise((resolve, reject) => {
    Folder.find({}).exec((err, folders) => {
      resolve(folders)
    })
  })
}

function getAllByPid (req) {
  const { pid } = req
  console.log('getAllByPid', pid)

  return new Promise((resolve, reject) => {
    Folder.find({ pid: pid }).exec((err, folders) => {
      resolve(folders)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Folder.findOne({ _id: id }).exec((err, folder) => {
      resolve(folder)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Folder.find({ trash: 'TRASH' }).exec((err, folders) => {
      resolve(folders)
    })
  })
}

export default {
  saveAll,
  add,
  removeAll,
  removeById,
  update,
  getAll,
  getAllByPid,
  getById,
  getTrash
}
