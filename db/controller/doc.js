import { LinvoDB } from './index.js'
import { getValid } from '../tools'
import docModel from '../models/doc'

var Doc = new LinvoDB('doc', {
  type: {
    type: String,
    default: 'doc'
  },
  remote_id: {
    type: String
  },
  note_id: String,
  remote_note_id: String,
  content: {
    type: String,
    default: ''
  },
  create_at: Date,
  update_at: Date,
  need_push: {
    type: Boolean,
    default: true
  }
})

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Doc.save(data).exec((err, docs) => {
      resolve(docs)
    })
  })
}

// add
function add (req) {
  console.log('add-doc', req)
  let data = docModel(req)

  return new Promise((resolve, reject) => {
    Doc.insert(data, (err, docs) => {
      resolve(docs)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Doc.find({}).exec((err, docs) => {
      docs.forEach(doc => {
        Doc.remove()
      })
      resolve(docs.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Doc.findOne({ _id: id }).exec((err, doc) => {
      Doc.remove()
      resolve()
    })
  })
}

// update
function update (req) {
  const { id } = req
  console.log('update-doc', req)

  return new Promise((resolve, reject) => {
    Doc.findOne({ _id: id })
    .exec((err, doc) => {
      Doc.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, newDoc) => {
          console.log('update-folder-111', newDoc)
          resolve(newDoc)
        }
      )
    })
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Doc.find({}).exec((err, docs) => {
      resolve(docs)
    })
  })
}

function getByNoteId (req) {
  const { note_id } = req
  console.log('getByNoteId', note_id, req)
  return new Promise((resolve, reject) => {
    Doc.findOne({ note_id: note_id }).exec((err, doc) => {
      resolve(doc)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Doc.findOne({ _id: id }).exec((err, doc) => {
      resolve(doc)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Doc.find({ trash: 'TRASH' }).exec((err, docs) => {
      resolve(docs)
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
  getByNoteId,
  getById,
  getTrash
}
