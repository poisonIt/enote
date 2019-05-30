import * as _ from 'lodash'
import { promisifyAll } from '../promisify'
import { htmlToText, isIllegal } from '../tools'
import noteModel from '../models/note'
import folderCtr from './folder'
import docCtr from './doc'
import docTemp from '../docTemplate'
import { LinvoDB } from '../index'
import doc from './doc';

let schemaKeys = Object.keys(noteModel({}))
let Note = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  Note = new LinvoDB(`note`, {
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
  promisifyAll(Note)
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
  let data = noteModel(req)

  return new Promise((resolve, reject) => {
    folderCtr.getById({ id: req.pid }).then(pFolder => {
      if (pFolder && pFolder.remote_id) {
        data.remote_pid = pFolder.remote_id
      }
      Note.insert(data, (err, note) => {
        if (err) {
          reject(err)
        }
        docCtr.add({
          note_id: note._id,
          content: req.isTemp ? docTemp : (req.content || '')
        }).then(() => {
          resolve(note)
        })
      })
    })
  })
}

async function diffAdd (req) {
  let notes = await getByQuery({ remote_id: req.remote_id }, { multi: true })

  let note = notes.shift()

  let p = notes.map(n => {
    return removeById({ id: n._id })
  })

  await Promise.all(p)

  if (note) {
    req.id = note._id
    return await new Promise((resolve, reject) => {
      update(req).then(newNote => {
        docCtr.getByNoteId({ id: newNote._id }).then(doc => {
          docCtr.update({ id: doc._id, content: req.content }).then(() => {
            resolve(newNote)
          })
        })
      })
    })
  } else {
    return await add(req)
  }
}

// function diffAdd (req) {
//   Note.findOne({ remote_id: req.remote_id }, (err, note) => {
//     if (note) {
//       req.id = note._id
//       return update(req).then(newNote => {
//         docCtr.getByNoteId({ id: newNote._id }).then(doc => {
//           docCtr.update({ id: doc._id, content: req.content })
//         })
//       })
//     } else {
//       return add(req)
//     }
//   })
// }

async function diffAddMulti (reqs) {
  let newNotes = await Promise.all(reqs.map(req => diffAdd(req)))

  let p = newNotes.map((note, index) => {
    return (async () => {
      let newNote = note
      let pL = await getByQuery({ id: note.pid })
      let pR = await getByQuery({ remote_id: note.remote_pid })
      if (pR) {
        if (pL) {
          if (pL._id !== pR._id) {
            newNote = await update({ id: note._id, pid: pR._id })
          }
        } else {
          newNote = await update({ id: note._id, pid: pR._id })
        }
      } else {
        newNote = await update({ id: note._id, pid: '0' })
      }
      return newNote
    })(note, index)
  })
  return await Promise.all(p)
}

function duplicate (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }, (err, note) => {
      let newNoteData = {
        pid: req.pid || note.pid,
        title: note.title,
        seq: note.seq,
        size: note.size
      }
      add(newNoteData).then(newNote => {
        docCtr.getByNoteId({ note_id: id }).then(doc => {
          docCtr.getByNoteId({ note_id: newNote._id }).then(newDoc => {
            docCtr.update({
              id: newDoc._id,
              content: doc.content
            }).then(newDoc => {
              resolve(newNote)
            })
          })
        })
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
        note.remove()
        docCtr.removeByNoteId({ note_id: id }).then(() => {
          resolve()
        })
      } else {
        reject()
      }
    })
  })
}

async function removeAllDeleted () {
  let notes = await getByQuery({ trash: 'DELETED' }, { multi: true })
  let p = notes.map(note => {
    return (async () => {
      await docCtr.removeByNoteId({ note_id: note._id })
      note.remove()
      return note
    })(note)
  })
  return await Promise.all(p)
}

function deleteAll () {
  return new Promise((resolve, reject) => {
    Note.find({}).exec((err, notes) => {
      let p = notes.map(note => {
        return update({
          id: note._id,
          trash: 'DELETED'
        })
      })
      Promise.all(p).then(() => {
        resolve(notes.length)
      })
    })
  })
}

// update
async function update (req) {
  const { id } = req
  req.update_at = new Date().valueOf()

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
      if (!note) {
        resolve()
        return
      }
      let old_trash = note.trash
      Note.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, num, newNote) => {
          if (req.trash === 'NORMAL' && old_trash !== newNote.trash) {
            folderCtr.update({
              id: newNote.pid,
              trash: 'NORMAL'
            }).then(() => {
              resolve(newNote)
            })
          } else {
            resolve(newNote)
          }
        }
      )
    })
  })
}

function updateByQuery (req) {
  const { query, data } = req
  data.need_push = true

  return new Promise((resolve, reject) => {
    Note.find(query, (err, notes) => {
      let p = notes.map(note => {
        let r = {}
        for (let i in data) {
          r[i] = data[i]
        }
        r.id = note._id
        return update(r)
      })
      Promise.all(p).then(res => {
        resolve(res)
      })
    })
  })
}


function updateMulti (reqs) {
  return new Promise((resolve, reject) => {
    let p = reqs.map(req => {
      return update(req)
    })
    Promise.all(p).then(res => {
      resolve(res)
    })
  })
}

function updateRemoteTagIds (req) {
  const { tags } = req
  let tagArr = tags.map(item => item.tag_id)
  let tagMap = {}
  tags.forEach(item => {
    tagMap[item.tag_id] = item.remote_id
  })

  return new Promise((resolve, reject) => {
    Note.find({}).filter(x => {
      return _.intersection(x.tags, tagArr).length > 0
    }).exec((err, notes) => {
      if (err) reject(err)
      let p = notes.map(note => {
        let itc = _.intersection(note.tags, tagArr)
        let newTags = _.pullAll(note.tags, itc)
        let remoteItc = itc.map(item => tagMap[item])
        newTags = _.concat(newTags, remoteItc)
        return update({
          id: note._id,
          tags: newTags
        })
      })
      Promise.all(p).then(res => {
        resolve(res)
      })
    })
  })
}

function trashAll (req) {
  const { trash } = req

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
        resolve(notes)
      }
    )
  })
}

function addTag (req) {
  const { id, tags } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }, (err, note) => {
      if (err) reject(err)
      if (!note) reject(`note ${id} not exist`)
      let newTags = _.union(note.tags, tags)
      Note.update(
        { _id: id },
        { $set: {
          tags: newTags,
          need_push: true 
        }},
        { multi: true },
        (err, num, newNote) => {
          resolve(newNote)
        }
      )
    })
  })
}

function removeTag (req) {
  const { id, tag_id } = req

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }, (err, note) => {
      if (err) reject(err)
      if (!note) reject(`note ${id} not exist`)
      let newTags = [...note.tags]
      newTags.splice(note.tags.indexOf(tag_id), 1)
      Note.update(
        { _id: id },
        { $set: {
          tags: newTags,
          need_push: true 
        }},
        { multi: true },
        (err, num, newNote) => {
          resolve(newNote)
        }
      )
    })
  })
}

// get
async function getAllByPid (req, opts) {
  const { pid, remote_pid } = req

  let querys = []
  if (!_.isUndefined(pid)) {
    querys.push({ pid: pid })
  }
  if (!_.isUndefined(remote_pid)) {
    querys.push({ remote_pid: remote_pid })
  }

  opts = opts || {}
  opts.multi = true

  return await getByQuery(
    querys,
    opts
  )
}

async function getById (req) {
  const { id } = req

  let note = await getByQuery({ _id: id })
  return note
}

async function getTrash (opts) {
  opts = opts || {}
  opts.multi = true

  return await getByQuery({ trash: 'TRASH' }, opts)
}

function getByTags (req) {
  const { tags } = req

  return new Promise((resolve, reject) => {
  Note.find({}).filter(x => {
    return _.intersection(x.tags, tags).length === tags.length
  }).exec((err, notes) => {
    let result = (async () => {
      if (err) reject(err)
      notes = await Promise.all(notes.map(note => {
        return patchSummary(note)
      }))
      notes = await Promise.all(notes.map(note => {
        return patchParentFolder(note)
      }))
      return notes
    })(notes)
    resolve(result)
  })
  })
}

async function getByQuery (params, opts) {
  opts = opts || {
    multi: false,
    with_parent_folder: false,
    with_summary: false
  }
  const isReqArr = _.isArray(params)
  const query = isReqArr ? { $or: params } : params

  let notes = []
  if (opts.multi) {
    let queryFunc = Note.find(query)
    if (opts.sort) {
      queryFunc = queryFunc.sort(opts.sort)
    }
    if (typeof opts.limit === 'number') {
      queryFunc = queryFunc.limit(opts.limit)
    }
    notes = await queryFunc.execAsync()
  } else {
    let note = await Note.findOne(query).execAsync()
    if (note) {
      notes.push(note)
    }
  }

  if (opts.with_summary) {
    notes = await Promise.all(notes.map(note => {
      return patchSummary(note)
    }))
  }

  if (opts.with_parent_folder) {
    notes = await Promise.all(notes.map(note => {
      return patchParentFolder(note)
    }))
  }

  if (opts.with_doc) {
    notes = await Promise.all(notes.map(note => {
      return (async () => {
        let doc = await docCtr.getByNoteId({ note_id: note._id })
        note.content = doc.content
        return note
      })(note)
    }))
  }
  
  return opts.multi ? notes : notes[0]
}

async function patchParentFolder (note) {
  let pFolder
  if (_.isUndefined(note.remote_pid)) {
    pFolder = await folderCtr.getByQuery({ _id: note.pid })
  } else {
    pFolder = await folderCtr.getByQuery([
      { _id: note.pid },
      { remote_id: note.remote_pid }]
    )
  }
  if (pFolder) {
    note.parent_folder = pFolder
    if (note.pid !== pFolder._id) {
      note.pid = pFolder._id
      await update({ id: note._id, pid: pFolder._id })
    }
  } else {
    note.parent_folder = null
    if (note.pid !== '0') {
      note.pid = '0'
      await update({ id: note._id, pid: '0' })
    }
  }
  return note
}

async function patchSummary (note) {
  let doc = await docCtr.getByNoteId({ note_id: note._id })
  if (doc) {
    note.summary = htmlToText(doc.content)
  }

  return note
}

export default {
  createCollection,
  saveAll,
  add,
  diffAdd,
  diffAddMulti,
  duplicate,
  removeAll,
  removeById,
  removeAllDeleted,
  deleteAll,
  update,
  updateByQuery,
  updateMulti,
  updateRemoteTagIds,
  trashAll,
  addTag,
  removeTag,
  getAllByPid,
  getById,
  getTrash,
  getByTags,
  getByQuery
}
