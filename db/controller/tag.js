import { getValid } from '../tools'
import tagModel from '../models/tag'
import { LinvoDB } from '../index'

let Tag = {}

function createCollection (path) {
  LinvoDB.dbPath = path

  Tag = new LinvoDB('tag', {
    name: {
      type: String,
      default: '未命名标签'
    },
    remote_id: {
      type: String
    },
    trash: {
      type: Boolean,
      default: 'NORMAL'
    }
  })
}

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Tag.save(data).exec((err, tags) => {
      resolve(tags)
    })
  })
}

// add
function add (req) {
  console.log('add-tag', req)
  let data = tagModel(req)

  return new Promise((resolve, reject) => {
    Tag.insert(data, (err, tags) => {
      resolve(tags)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Tag.find({}).exec((err, tags) => {
      tags.forEach(tag => {
        tag.remove()
      })
      resolve(tags.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Tag.findOne({ _id: id }).exec((err, tag) => {
      Tag.remove()
      resolve()
    })
  })
}

function removeByNoteId (req) {
  const { note_id } = req

  return new Promise((resolve, reject) => {
    Tag.findOne({ note_id: note_id }).exec((err, tag) => {
      Tag.remove()
      resolve()
    })
  })
}

// update
function update (req) {
  const { id } = req
  console.log('update-tag', req)

  return new Promise((resolve, reject) => {
    Tag.findOne({ _id: id })
    .exec((err, tag) => {
      Tag.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, num, newTag) => {
          console.log('update-folder-111', newTag)
          noteCtr.update({
            id: newTag.note_id,
            need_push: true
          }).then(note => {
            resolve(newTag)
          })
        }
      )
    })
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Tag.find({}).exec((err, tags) => {
      resolve(tags)
    })
  })
}

function getByNoteId (req) {
  const { note_id } = req
  console.log('getByNoteId', note_id, req)
  return new Promise((resolve, reject) => {
    Tag.findOne({ note_id: note_id }).exec((err, tag) => {
      resolve(tag)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Tag.findOne({ _id: id }).exec((err, tag) => {
      resolve(tag)
    })
  })
}

function getTrash () {
  return new Promise((resolve, reject) => {
    Tag.find({ trash: 'TRASH' }).exec((err, tags) => {
      resolve(tags)
    })
  })
}

export default {
  createCollection,
  saveAll,
  add,
  removeAll,
  removeById,
  removeByNoteId,
  update,
  getAll,
  getByNoteId,
  getById,
  getTrash
}
