import noteModel from '../models/note'
import doc from './doc'
import { getValid } from '../tools'
import folder from './folder'
const { remote } = require('electron')
const { noteDB } = remote.app.database

function removeAll (files) {
  return new Promise((resolve, reject) => {
    noteDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getAll () {
  return new Promise((resolve, reject) => {
    noteDB.find({}, (err, notes) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection files_db:', notes)
        resolve(notes)
      }
    })
  })
}

function getById (req) {
  let { id } = req
  return new Promise((resolve, reject) => {
    noteDB.findOne({
      _id: id
    }, (err, note) => {
      if (err) {
        reject(err)
      } else {
        resolve(note)
      }
    })
  })
}

function getByPid (req) {
  let { pid } = req
  console.log('getByPid', pid)
  return new Promise((resolve, reject) => {
    folder.getById({ id: pid }).then(folderDoc => {
      console.log('folderDoc', folderDoc)
      noteDB.find({
        pid: pid
      }, (err, notes) => {
        if (err) {
          reject(err)
        } else {
          resolve(notes.map(item => {
            item.folder_title = folderDoc.title
            return item
          }))
        }
      })
    })
  })
}

function add (opts) {
  return new Promise((resolve, reject) => {
    noteDB.insert(noteModel(opts), (err, newNote) => {
      if (err) {
        console.error(err)
      } else {
        doc.add({
          note_id: newNote._id
        }).then(newDoc => {
          resolve(newNote)
        })
      }
    })
  })
}

function update (opts) {
  const { id } = opts
  console.log('update-local', id, opts)

  return new Promise((resolve, reject) => {
    noteDB.findOne({ _id: id }, (err, note) => {
      if (err) {
        reject(err)
      } else {
        noteDB.update(
          { _id: id },
          { $set: {
            remote_id: getValid('remote_id', opts, note),
            pid: getValid('pid', opts, note),
            title: getValid('title', opts, note),
            seq: getValid('seq', opts, note),
            trash: getValid('trash', opts, note),
            update_at: new Date(),
            need_push: opts.need_push !== undefined ? opts.need_push : true,
            content: getValid('content', opts, note),
            tags: getValid('tags', opts, note),
            top: getValid('top', opts, note)
          }},
          {
            returnUpdatednotes: true
          },
          (err, num, notes) => {
            if (err) reject(err)
            resolve(notes)
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
  getByPid,
  add,
  update
}
