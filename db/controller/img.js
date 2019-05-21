import { unlinkSync } from 'fs'
import { getValid } from '../tools'
import imgModel from '../models/img'
import { LinvoDB } from '../index'
import noteCtr from './note'

let Img = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  Img = new LinvoDB(`img`, {
    type: {
      type: String,
      default: 'img'
    },
    name: {
      type: String,
      default: ''
    },
    path: {
      type: String,
      default: ''
    },
    note_id: {
      type: String,
      default: ''
    },
    ext: {
      type: String,
      default: ''
    },
    mime: {
      type: String,
      default: ''
    }
  })
}

// add
function add (req) {
  let data = imgModel(req)

  return new Promise((resolve, reject) => {
    Img.insert(data, (err, imgs) => {
      resolve(imgs)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Img.find({}).exec((err, imgs) => {
      imgs.forEach(img => {
        img.remove()
      })
      resolve(imgs.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Img.findOne({ _id: id }).exec((err, img) => {
      img.remove()
      unlinkSync(img.path.replace('file:///', ''))
      resolve()
    })
  })
}

function deleteAll () {
  return new Promise((resolve, reject) => {
    Img.find({}).exec((err, imgs) => {
      imgs.forEach(img => {
        img.remove()
        unlinkSync(img.path.replace('file:///', ''))
      })
      resolve(imgs.length)
    })
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    Img.find({}).exec((err, imgs) => {
      resolve(imgs)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    Img.findOne({ _id: id }).exec((err, img) => {
      resolve(img)
    })
  })
}

export default {
  createCollection,
  add,
  removeAll,
  removeById,
  deleteAll,
  getAll,
  getById
}
