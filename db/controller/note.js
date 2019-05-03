import { getValid } from '../tools'
import noteModel from '../models/note'
import folderCtr from './folder'
import docCtr from './doc'
import docTemp from '../docTemplate'
import { LinvoDB } from '../index'
import doc from './doc';

let Note = {}

function createCollection (path) {
  LinvoDB.dbPath = path

  Note = new LinvoDB('note', {
    type: {
      type: String,
      default: 'note'
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
      default: '无标题笔记'
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


// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Note.save(data, (err, notes) => {
      resolve(notes)
    })
  })
}

// add
async function add (req) {
  console.log('add-note', req)
  let data = noteModel(req)

  if (req.hasOwnProperty('pid') && !req.hasOwnProperty('remote_pid')) {
    let folder = await folderCtr.getById({ id: req.pid })
    data.remote_pid = folder ? folder.remote_id : '0'
    console.log('add-note-0000', folder, data)
  }
  console.log('add-note-1111', data)

  return new Promise((resolve, reject) => {
    Note.insert(data, (err, note) => {
      docCtr.add({
        note_id: note._id,
        content: req.isTemp ? docTemp : (req.content || '')
      }).then(() => {
        resolve(note)
      })
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Note.find({}, (err, notes) => {
      notes.forEach(note => {
        note.remove()
      })
      resolve(notes.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }, (err, note) => {
      if (note) {
        console.log('removeById', id, note)
        note.remove()
        doc.removeByNoteId({ note_id: id }).then(() => {
          resolve()
        })
      } else {
        reject()
      }
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
    let folder = await folderCtr.getById({ id: req.pid })
    req.remote_pid = folder ? folder.remote_id : '0'
  }

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id })
    .exec((err, note) => {
      Note.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, num, newNote) => {
          console.log('update-folder-111', newNote)
          resolve(newNote)
        }
      )
    })
  })
}

function updateByQuery (req) {
  const { query, data } = req
  data.need_push = true
  console.log('update-note-query', query, data)

  return new Promise((resolve, reject) => {
    Note.update(
      query,
      { $set: data },
      { multi: true },
      (err, num, newNote) => {
        console.log('update-note-by-query-111', newNote)
        resolve(newNote)
      }
    )
  })
}

function trashAll (req) {
  const { trash } = req
  console.log('trashAll', req)

  return new Promise((resolve, reject) => {
    if (['NORMAL', 'TRASH', 'DELETED'].indexOf(trash) === -1) {
      reject(`trash value ${trash} illegal`)
    }
    Note.update(
      {},
      { $set: {
        trash: trash,
        need_push: true
      }},
      { multi: true },
      (err, num, notes) => {
        if (err) reject(err)
        console.log('trashAll-res', num, notes)
        resolve(notes)
      }
    )
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Note.find({ trash: 'NORMAL' }, (err, notes) => {
      resolve(notes)
    })
  })
}

function getAllByQuery (req) {
  const { query, with_doc } = req
  console.log('getAllByQuery', req, query, with_doc)

  return new Promise((resolve, reject) => {
    Note.find(query, (err, notes) => {
      console.log('getAllByQuery-notes', notes)
      if (with_doc) {
        let p = notes.map(note => {
          return docCtr.getByNoteId({ note_id: note._id })
        })
        Promise.all(p).then(docs => {
          console.log('docs', docs)
          notes.forEach((note, index) => {
            note.content = docs[index].content
          })
          resolve(notes)
        })
      } else {
        resolve(notes)
      }
    })
  })
}

function getAllByPid (req) {
  const { pid, remote_pid } = req
  console.log('getAllByPid', pid, remote_pid, req)

  if (remote_pid) {
    return new Promise((resolve, reject) => {
      Note.find({ remote_pid: remote_pid }, (err, notes) => {
        resolve(notes)
      })
    })
  } else {
    return new Promise((resolve, reject) => {
      Note.find({ pid: pid }, (err, notes) => {
        resolve(notes)
      })
    })
  }
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }, (err, note) => {
      resolve(note)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Note.find({ trash: 'TRASH' }, (err, notes) => {
      resolve(notes)
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
  updateByQuery,
  trashAll,
  getAll,
  getAllByQuery,
  getAllByPid,
  getById,
  getTrash
}
