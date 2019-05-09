import * as _ from 'lodash'
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
    size: {
      type: Number,
      default: 0
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

function diffAdd (req) {
  console.log('diffAdd', req)
  Note.findOne({ remote_id: req.remote_id }, (err, note) => {
    console.log('diffAdd-1111', note)
    if (note) {
      return update(req).then(newNote => {
        console.log('diffAdd-2222', newNote)
        docCtr.getByNoteId({ id: newNote._id }).then(doc => {
          docCtr.update({ id: doc._id, content: req.content })
        })
      })
    } else {
      console.log('diffAdd-3333', note)
      return add(req)
    }
  })
}

function duplicate (req) {
  console.log('duplicate', req)
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
          console.log('duplicate-doc', doc, newNote)
          docCtr.getByNoteId({ note_id: newNote._id }).then(newDoc => {
            docCtr.update({
              id: newDoc._id,
              content: doc.content
            }).then(newDoc => {
              console.log('duplicate-do-111', newDoc, newNote)
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
        console.log('removeById', id, note)
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

function removeAllDeleted () {
  console.log('removeAllDeleted')
  return new Promise((resolve, reject) => {
    Note.find({ trash: 'DELETED' }, (err, notes) => {
      let p = notes.map(note => {
        return new Promise((resolve, reject) => {
          docCtr.removeByNoteId({ note_id: note._id }).then(() => {
            note.remove()
          })
        })
      })
      Promise.all(p).then(() => {
        console.log('removeAllDeleted-res', p)
        resolve(p.length)
      })
    })
  })
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
        // removeAll().then(() => {
          resolve(notes.length)
        // })
      })
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
            console.log('update-p', newNote)
            folderCtr.update({
              id: newNote.pid,
              trash: 'NORMAL'
            }).then(() => {
              resolve(newNote)
            })
          } else {
            console.log('update-folder-111', newNote)
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
  console.log('update-note-query', query, data)

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
        console.log('update-note-by-query-111', res)
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
  console.log('updateRemoteTagIds', req, tagArr, tagMap)

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
        console.log('updateRemoteTagIds-11111', note.tags, itc, newTags, remoteItc, newTags)
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

function addTag (req) {
  const { id, tags } = req
  console.log('addTag', req)

  return new Promise((resolve, reject) => {
    Note.findOne({ _id: id }, (err, note) => {
      if (err) reject(err)
      if (!note) reject(`note ${id} not exist`)
      console.log('oldTags', note, note.tags, tags)
      let newTags = _.union(note.tags, tags)
      console.log('newTags', newTags)
      Note.update(
        { _id: id },
        { $set: {
          tags: newTags,
          need_push: true 
        }},
        { multi: true },
        (err, num, newNote) => {
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
    Note.find({}, (err, notes) => {
      let p = notes.map(note => {
        return new Promise((resolve, reject) => {
          folderCtr.getById({ id: note.pid }).then(folder => {
            if (!folder) {
              if (note.pid !== '0') {
                update({ id: note._id, pid: '0' }).then(() => {
                  note.folder_title = '我的文件夹'
                  resolve(note)
                })
              } else {
                note.folder_title = '我的文件夹'
                resolve(note)
              }
            } else {
              note.folder_title = folder.title
              resolve(note)
            }
          })
        })
      })
      Promise.all(p).then(res => {
        resolve(res)
      })
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
            note.content = docs[index] ? docs[index].content : ''
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

  return new Promise((resolve, reject) => {
    folderCtr.getById({ id: pid }).then(pFolder => {
      let folder_title = pFolder ? pFolder.title : '我的文件夹'
      if (remote_pid) {
        Note.find({ remote_pid: remote_pid }, (err, notes) => {
          if (Object.prototype.toString.call(notes) === `[object Array]`) {
            notes.forEach(note => {
              note.folder_title = folder_title
            })
          } else {
            if (notes) {
              notes.folder_title = folder_title
            }
          }
          resolve(notes)
        })
      } else {
        Note.find({ pid: pid }, (err, notes) => {
          if (Object.prototype.toString.call(notes) === `[object Array]`) {
            notes.forEach(note => {
              note.folder_title = folder_title
            })
          } else {
            if (notes) {
              notes.folder_title = folder_title
            }
          }
          resolve(notes)
        })
      }
    })
  })
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

function getByTags (req) {
  const { tags } = req

  return new Promise((resolve, reject) => {
    Note.find({}).filter(x => {
      return _.intersection(x.tags, tags).length === tags.length
    }).exec((err, notes) => {
      if (err) reject(err)
      resolve(notes)
    })
  })
}

export default {
  createCollection,
  saveAll,
  add,
  diffAdd,
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
  getAll,
  getAllByQuery,
  getAllByPid,
  getById,
  getTrash,
  getByTags
}
