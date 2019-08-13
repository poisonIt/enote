import * as _ from 'lodash'
import { promisifyAll } from '../promisify'
import { htmlToText } from '../tools'
import noteModel from '../models/note'
import folderCtr from './folder'
import docCtr from './doc'
import docTemp from '../docTemplate'
import { LinvoDB } from '../index'

let SharedNote = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  SharedNote = new LinvoDB(`shared-note`, {
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
    size: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    top: {
      type: Boolean,
      default: false
    }
  })
  promisifyAll(SharedNote)
}

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    SharedNote.save(data, (err, notes) => {
      if (err) {
        reject(err)
      }
      resolve(notes)
    })
  })
}

// add
async function add (req) {
  let data = noteModel(req)

  return new Promise((resolve, reject) => {
    folderCtr.getById({ id: req.pid }).then(pFolder => {
      if (pFolder && pFolder.remote_id) {
        data.remote_pid = pFolder.remote_id
      }
      SharedNote.insert(data, (err, note) => {
        if (err) {
          reject(err)
        }
        docCtr.add({
          note_id: note._id,
          content: req.isTemp ? docTemp : (req.content || '')
        }).then(doc => {
          note.summary = htmlToText(doc.content)
          resolve(note)
        })
      })
    })
  })
}

async function multiAdd (req) {
  let p = req.map(item => add(item))

  let result = await Promise.all(p)
  return result
}

async function removeAll () {
  SharedNote.find({}, (err, notes) => {
    if (err) {
      return
    }
    let p = notes.map(note => {
      return docCtr.getByNoteId({ note_id: note._id }).then(doc => {
        doc && doc.remove()
        note.remove()
      })
    })
    Promise.all(p)
  })
}

async function updateAll (req) {
  await removeAll()
  let result = await multiAdd(req)
  return result
}

function getAll (req) {
  return new Promise((resolve, reject) => {
    SharedNote.find({}).exec((err, notes) => {
      console.log('SharedNote-getAll', notes)
      if (err) {
        reject(err)
      }
      resolve(notes)
    })
  })
}

export default {
  createCollection,
  saveAll,
  multiAdd,
  removeAll,
  updateAll,
  getAll
}
