import docModel from '../models/doc'
import { getValid } from '../tools'
const { remote } = require('electron')
const { docDB } = remote.app.database

function removeAll (files) {
  return new Promise((resolve, reject) => {
    docDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getAll () {
  return new Promise((resolve, reject) => {
    docDB.find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection doc_db:', docs)
        resolve(docs)
      }
    })
  })
}

function getById (req) {
  let { id } = req
  return new Promise((resolve, reject) => {
    docDB.findOne({
      _id: id
    }, (err, doc) => {
      if (err) {
        reject(err)
      } else {
        resolve(doc)
      }
    })
  })
}

function getByNoteId (req) {
  let { noteId } = req
  console.log('getByNoteId', req)
  return new Promise((resolve, reject) => {
    docDB.findOne({
      note_id: noteId
    }, (err, doc) => {
      console.log('getByNoteId-result', doc)
      if (err) {
        reject(err)
      } else {
        resolve(doc)
      }
    })
  })
}

function add (opts) {
  return new Promise((resolve, reject) => {
    docDB.insert(docModel(opts), (err, newdoc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(newdoc)
      }
    })
  })
}

function update (opts) {
  const { id } = opts
  console.log('update-local', id, opts)

  return new Promise((resolve, reject) => {
    docDB.findOne({ _id: id }, (err, doc) => {
      if (err) {
        reject(err)
      } else {
        docDB.update(
          { _id: id },
          { $set: {
            note_id: getValid('note_id', opts, doc),
            remote_note_id: getValid('remote_note_id', opts, doc),
            remote_id: getValid('remote_id', opts, doc),
            content: getValid('content', opts, doc),
            update_at: new Date(),
            need_push: opts.need_push !== undefined ? opts.need_push : true
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
  removeAll,
  getAll,
  getById,
  getByNoteId,
  add,
  update
}
