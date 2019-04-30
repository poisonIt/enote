import noteModel from '../models/note'
import { getValid } from '../tools'
import doc from './doc'
import folder from './folder'
import docTemp from '../docTemplate'
import * as _ from 'lodash'

const { remote } = require('electron')
const db = remote.app.database

function removeAll (files) {
  return new Promise((resolve, reject) => {
    db.noteDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getAll () {
  // console.log('getAll-note')
  return new Promise((resolve, reject) => {
    db.noteDB.find({ trash: 'NORMAL' }, (err, notes) => {
      if (err) {
        reject(err)
      } else {
        let result = notes
        console.log('all documents in collection note_db:', result)
        resolve(result)
      }
    })
  })
}

function getById (req) {
  let { id } = req
  return new Promise((resolve, reject) => {
    db.noteDB.findOne({
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
  return new Promise((resolve, reject) => {
    if (pid === '0') {
      db.noteDB.find({
        pid: pid,
        trash: 'NORMAL'
      }, (err, notes) => {
        if (err) {
          reject(err)
        } else {
          resolve(notes.map(item => {
            item.folder_title = '我的文件夹'
            return item
          }))
        }
      })
    } else {
      folder.getById({ id: pid }).then(folderDoc => {
        db.noteDB.find({
          pid: pid,
          trash: 'NORMAL'
        }, (err, notes) => {
          if (err) {
            reject(err)
          } else {
            resolve(notes.map(item => {
              item.folder_title = folderDoc.title
              return Object.assign({}, item)
            }))
          }
        })
      })
    }
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    db.noteDB.find({
      trash: 'TRASH'
    }, (err, notes) => {
      if (err) {
        reject(err)
      } else {
        resolve(notes)
      }
    })
  })
}

function add (opts) {
  return new Promise((resolve, reject) => {
    db.noteDB.insert(noteModel(opts), (err, newNote) => {
      if (err) {
        console.error(err)
      } else {
        doc.add({
          note_id: newNote._id,
          content: opts.isTemp ? docTemp : (opts.content || '')
        }).then(newNote => {
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
    db.noteDB.findOne({ _id: id }, (err, note) => {
      if (err) {
        reject(err)
      } else {
        db.noteDB.update(
          { _id: id },
          { $set: {
            remote_id: getValid('remote_id', opts, note),
            pid: getValid('pid', opts, note),
            title: getValid('title', opts, note),
            seq: getValid('seq', opts, note),
            trash: getValid('trash', opts, note),
            update_at: new Date(),
            need_push: opts.need_push !== undefined ? opts.need_push : true,
            // content: getValid('content', opts, note),
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
  getTrash,
  add,
  update
}
