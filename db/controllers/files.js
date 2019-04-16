import doc from './doc'
import docTemplate from '../docTemplate'
import fileModel from '../models/file'
import docModel from '../models/doc'
const { remote } = require('electron')
const { filesDB } = remote.app.database

function saveAll (files) {
  return new Promise((resolve, reject) => {
    filesDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      filesDB.insert({
        files: files
      }, (err, newDocs) => {
        if (err) reject(err)
        resolve(newDocs.files)
      })
    })
  })
}

function removeAll (files) {
  return new Promise((resolve, reject) => {
    filesDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getAll () {
  return new Promise((resolve, reject) => {
    console.log('getAll')
    filesDB.find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection files_db:', docs)
        resolve(docs)
      }
    })
  })
}

function add (opts) {
  opts.content = opts.is_temp ? docTemplate : opts.content
  return new Promise((resolve, reject) => {
    filesDB.insert(fileModel(opts), (err, newDoc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(newDoc)
      }
    })
  })
}

function update (opts) {
  const { id, data } = opts

  return new Promise((resolve, reject) => {
    filesDB.findOne({ _id: id }, (err, fileDoc) => {
      if (err) {
        reject(err)
      } else {
        // console.log('update-fileDoc', fileDoc)
        filesDB.update(
          { _id: id },
          { $set: {
            title: data.title !== undefined ? data.title : fileDoc.title,
            seq: data.seq !== undefined ? data.seq : fileDoc.seq,
            update_at: new Date(),
            file_size: data.file_size !== undefined ? data.file_size : fileDoc.file_size,
            // file_path: data.file_path !== undefined ? data.file_path : fileDoc.file_path,
            parent_folder: data.parent_folder !== undefined ? data.parent_folder : fileDoc.parent_folder,
            content: data.content !== undefined ? data.content : fileDoc.content,
            need_push: data.need_push !== undefined ? data.need_push : true,
            trash: data.trash !== undefined ? data.trash : fileDoc.trash
          }},
          {
            returnUpdatedDocs: true
          },
          (err, num, docs) => {
            if (err) reject(err)
            resolve(docs)
          }
        )
      }
    })
  })
 
}

export default {
  getAll,
  add,
  saveAll,
  removeAll,
  update
}
