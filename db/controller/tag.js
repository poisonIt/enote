import { LinvoDB } from '../index'
import { promisifyAll } from '../promisify'
// import { getValid } from '../tools'
import tagModel from '../models/tag'
import noteCtr from './note'

let Tag = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  Tag = new LinvoDB(`tag`, {
    type: {
      type: String,
      default: 'tag'
    },
    name: {
      type: String,
      default: '未命名标签'
    },
    remote_id: {
      type: String
    },
    trash: {
      type: String,
      default: 'NORMAL'
    },
    need_push: {
      type: Boolean,
      default: true
    }
  })

  Tag.ensureIndex({
    fieldName: 'name',
    unique: true
  })

  promisifyAll(Tag)
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
async function add (req) {
  const { note_id, name } = req
  let data = tagModel(req)
  let note

  if (req.hasOwnProperty('note_id')) {
    note = await noteCtr.getById({ id: note_id })
  }

  return new Promise((resolve, reject) => {
    Tag.findOne({ name: name }).exec((err, tag) => {
      // console.log('add-req', req)
      // console.log('add-tag', tag)
      if (tag) {
        if (tag.trash === 'DELETED') {
          update({ id: tag._id, trash: 'NORMAL' }).then(res => {
            handleAddTag(tag, note).then(t => {
              resolve(t)
            })
          })
        } else {
          handleAddTag(tag, note).then(t => {
            resolve(t)
          })
        }
      } else {
        Tag.insert(data, (err, newTag) => {
          handleAddTag(newTag, note).then(t => {
            resolve(t)
          })
        })
      }
    })
  })
}

function handleAddTag (tag, note) {
  return new Promise((resolve, reject) => {
    if (note) {
      noteCtr.addTag({
        id: note._id,
        tags: [tag._id]
      }).then(res => {
        resolve(tag)
      })
    } else {
      resolve(tag)
    }
  })
}

function diffAdd (req) {
  return new Promise((resolve, reject) => {
    Tag.findOne({ remote_id: req.remote_id }, (err, tag) => {
      if (tag) {
        req.id = tag._id
        update(req).then(res => {
          resolve(res)
        })
      } else {
        add(req).then(res => {
          resolve(res)
        })
      }
    })
  })
}

async function diffAddMulti (reqs) {
  let allTags = await Tag.find({}).execAsync()
  let reqIds = reqs.map(tag => tag.remote_id)
  let reqNames = reqs.map(tag => tag.name)
  let tagsNeedDelete = []
  let tagsNeedRemove = allTags.filter(tag => {
    if (tag.remote_id && (reqIds.indexOf(tag.remote_id) === -1)) {
      return true
    } else {
      if (tag.remote_id === undefined && (reqNames.indexOf(tag.name) > -1))
      tagsNeedDelete.push(tag)
      return false
    }
  })

  let dP = tagsNeedDelete.map(tag => {
    return new Promise((resolve, reject) => {
      update({ id: tag._id, trash: 'DELETED' }).then(() => {
        tag.remove()
      })
    })
  })

  // console.log('diffAddMulti-allTags', allTags)
  // console.log('diffAddMulti-reqs', reqs)
  // console.log('diffAddMulti-tagsNeedDelete', tagsNeedDelete)
  // console.log('diffAddMulti-tagsNeedRemove', tagsNeedRemove)

  let rP = tagsNeedRemove.map(tag => {
    return removeById({ id: tag._id })
  })

  let aP = reqs.map(req => {
    return diffAdd(req)
  })  

  await Promise.all(dP)
  await Promise.all(rP)
  await sleep(100)
  return await Promise.all(aP)
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
      tag.remove()
      resolve()
    })
  })
}

async function removeByQuery (req) {
  let tag = await getByQuery(req)

  tag.remove()
}

function deleteAll () {
  Tag.find({}).exec((err, tags) => {
    let p = tags.map(tag => {
      return update({
        id: tag._id,
        need_push: true,
        trash: 'DELETED'
      })
    })
    Promise.all(p).then(() => {
      resolve(tags.length)
    })
  })
}

// update
function updateP (query, req, multi) {
  return new Promise((resolve, reject) => {
    Tag.update(
      query,
      req,
      { multi: true },
      (err, num, newTags) => {
        if (err) {
          reject(err)
        }
        resolve(newTags)
      }
    )
  })
}

async function update (req) {
  const { id } = req
  req.update_at = new Date().valueOf()

  if (!req.hasOwnProperty('need_push')) {
    req.need_push = true
  }

  if (req.hasOwnProperty('trash')) {
    if (req.trash === 'DELETED') {
      let notes = await noteCtr.getByTags({ tags: [id] })
      await Promise.all(notes.map(note => {
        return noteCtr.removeTag({ id: note._id, tag_id: id })
      }))
    }
  }

  let tag = await getById({ id: id })

  if (tag) {
    if (req.hasOwnProperty('name')) {
      let sameNameTag = await getByQuery({ name: req.name })
      if (sameNameTag && sameNameTag._id !== tag._id) {
        if (sameNameTag.trash === 'NORMAL') {
          return null
        } else {
          await updateP(
            { _id: sameNameTag._id },
            { $set: { name: sameNameTag.name + sameNameTag._id } }
          )
        }
      }
    }

    let newTag = await updateP(
      { _id: id },
      { $set: req }
    )
    return newTag
  } else {
    return null
  }
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

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Tag.find({}).exec((err, tags) => {
      resolve(tags)
    })
  })
}

function getAllByQuery (req) {
  const { query } = req

  return new Promise((resolve, reject) => {
    Tag.find(query, (err, tags) => {
      resolve(tags)
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

async function getByQuery (params, opts) {
  opts = opts || {
    multi: false
  }
  const isReqArr = _.isArray(params)
  const query = isReqArr ? { $or: params } : params
  
  let tags = []
  if (opts.multi) {
    let queryFunc = Tag.find(query)
    if (opts.sort) {
      queryFunc = queryFunc.sort(opts.sort)
    }
    if (typeof opts.limit === 'number') {
      queryFunc = queryFunc.limit(opts.limit)
    }
    tags = await queryFunc.execAsync()
  } else {
    let tag = await Tag.findOne(query).execAsync()
    if (tag) {
      tags.push(tag)
    }
  }
  
  return opts.multi ? tags : tags[0]
}

function sleep (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

export default {
  createCollection,
  saveAll,
  add,
  diffAdd,
  diffAddMulti,
  removeAll,
  removeById,
  removeByQuery,
  deleteAll,
  update,
  updateMulti,
  getAll,
  getById,
  getAllByQuery,
  getByQuery,
  getTrash
}
