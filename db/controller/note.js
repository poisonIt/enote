import { LinvoDB } from './index.js'
import { getValid } from '../tools'
import noteModel from '../models/note'
import docCtr from './doc'
import docTemp from '../docTemplate'

var Note = new LinvoDB('note', {
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

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Note.save(data).exec((err, notes) => {
      resolve(notes)
    })
  })
}

// add
function add (req) {
  // console.log('add-note', req)
  let data = noteModel(req)

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
    Note.find({}).exec((err, notes) => {
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
    Note.findOne({ _id: id }).exec((err, note) => {
      note.remove()
      resolve()
    })
  })
}

// update
function update (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id })
    .exec((err, note) => {
      Note.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, newNote) => {
          console.log('update-folder-111', newNote)
          resolve(newNote)
        }
      )
    })
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Note.find({}).exec((err, notes) => {
      resolve(notes)
    })
  })
}

function getAllByPid (req) {
  const { pid } = req
  console.log('getAllByPid', pid, req)
  return new Promise((resolve, reject) => {
    Note.find({ pid: pid }).exec((err, notes) => {
      resolve(notes)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }).exec((err, note) => {
      resolve(note)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Note.find({ trash: 'TRASH' }).exec((err, notes) => {
      resolve(notes)
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
