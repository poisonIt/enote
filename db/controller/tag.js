import { getValid } from '../tools'
import tagModel from '../models/tag'
import { LinvoDB } from '../index'

let Tag = {}

function createCollection (path) {
  LinvoDB.dbPath = path

  Tag = new LinvoDB('tag', {
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
  console.log('add-tag', req)
  let data = tagModel(req)

  return new Promise((resolve, reject) => {
    Tag.findOne({ name: name }).exec((err, tag) => {
      if (tag) {
        resolve(tag)
      } else {
        Tag.insert(data, (err, tags) => {
          console.log('add-tag', tags)
          resolve(tags)
        })
      }
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
      // removeAll().then(() => {
        resolve(tags.length)
      // })
    })
  })
}

// update
function update (req) {
  const { id } = req
  console.log('update-tag', req)

  if (!req.hasOwnProperty('need_push')) {
    req.need_push = true
  }

  return new Promise((resolve, reject) => {
    console.log('update-111', Tag)
    Tag.findOne({ _id: id })
    .exec((err, tag) => {
      Tag.update(
        { _id: id },
        { $set: req },
        { multi: true },
        (err, num, newTag) => {
          if (err) {
            console.log('err', err)
          }
          console.log('update-tag-111', newTag)
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
      console.log('getAll-tags', tags)
      resolve(tags)
    })
  })
}

function getAllByQuery (req) {
  const { query } = req
  console.log('getAllByQuery', req, query)

  return new Promise((resolve, reject) => {
    Tag.find(query, (err, tags) => {
      console.log('getAllByQuery-tags', tags)
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
