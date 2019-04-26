import folderModel from '../models/folder'
import { getValid } from '../tools'
const { remote } = require('electron')
const { folderDB } = remote.app.database

function removeAll (files) {
  return new Promise((resolve, reject) => {
    folderDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getAll () {
  return new Promise((resolve, reject) => {
    folderDB.find({}, (err, folders) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection files_db:', folders)
        resolve(folders)
      }
    })
  })
}

function getById (req) {
  let { id } = req
  return new Promise((resolve, reject) => {
    folderDB.findOne({
      _id: id
    }, (err, folder) => {
      if (err) {
        reject(err)
      } else {
        resolve(folder)
      }
    })
  })
}

function add (opts) {
  return new Promise((resolve, reject) => {
    folderDB.insert(folderModel(opts), (err, newFolder) => {
      if (err) {
        console.error(err)
      } else {
        resolve(newFolder)
      }
    })
  })
}

function update (opts) {
  const { id } = opts
  console.log('update-local', id, opts)

  return new Promise((resolve, reject) => {
    folderDB.findOne({ _id: id }, (err, folder) => {
      if (err) {
        reject(err)
      } else {
        folderDB.update(
          { _id: id },
          { $set: {
            pid: getValid('pid', opts, folder),
            remote_id: getValid('remote_id', opts, folder),
            title: getValid('title', opts, folder),
            seq: getValid('seq', opts, folder),
            trash: getValid('trash', opts, folder),
            update_at: new Date(),
            need_push: opts.need_push !== undefined ? opts.need_push : true
          }},
          {
            returnUpdatedDocs: true
          },
          (err, num, folders) => {
            if (err) reject(err)
            resolve(folders)
          }
        )
      }
    })
  })
}

export default {
  removeAll,
  getAll,
  getById,
  add,
  update
}
