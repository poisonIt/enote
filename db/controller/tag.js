import { getValid } from '../tools'
import tagModel from '../models/tag'
import { LinvoDB } from '../index'

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
      type: Boolean,
      default: 'NORMAL'
    }
  })

  Tag.ensureIndex({
    fieldName: 'name',
    unique: true
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
  const { name } = req
  let data = tagModel(req)

  return new Promise((resolve, reject) => {
    Tag.findOne({ name: name }).exec((err, tag) => {
      if (tag) {
        resolve(tag)
      } else {
        Tag.insert(data, (err, tags) => {
          resolve(tags)
        })
      }
    })
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

function diffAddMulti (reqs) {
  return new Promise((resolve, reject) => {
    let p = reqs.map(req => {
      return diffAdd(req)
    })
    Promise.all(p).then(res => {
      resolve(res)
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
      tag.remove()
      resolve()
    })
  })
}

function deleteAll () {
  Tag.find({}).exec((err, tags) => {
    let p = tags.map(tag => {
      return update({
        id: tag._id,
        trash: 'DELETED'
      })
    })
    Promise.all(p).then(() => {
      resolve(tags.length)
    })
  })
}

// update
function update (req) {
  const { id } = req

  if (!req.hasOwnProperty('need_push')) {
    req.need_push = true
  }

  return new Promise((resolve, reject) => {
    Tag.findOne({ _id: id })
    .exec((err, tag) => {
      Tag.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, num, newTag) => {
          reject(err)
          if (!newTag) {
            resolve(tag)
          } else {
            resolve(newTag)
          }
        }
      )
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

export default {
  createCollection,
  saveAll,
  add,
  diffAdd,
  diffAddMulti,
  removeAll,
  removeById,
  deleteAll,
  update,
  updateMulti,
  getAll,
  getById,
  getAllByQuery,
  getTrash
}
