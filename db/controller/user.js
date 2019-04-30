import { LinvoDB } from './index.js'
import { getValid } from '../tools'

var User = new LinvoDB('user', {
    username: String,
    password: String,
    oa_id: String,
    account_name_cn: String,
    image_url: String,
    position_id: String,
    position_name: String,
    department_id: String,
    department_name: String,
    friend_list: [String],
    is_sync: {
      type: Boolean,
      default: false
    },
    access_token: String,
    id_token: String
})

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    User.save(data).exec((err, users) => {
      resolve(users)
    })
  })
}

// add
function add (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    User.insert(data).exec((err, users) => {
      resolve(users)
    })
  })
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    User.remove({}).exec((err, users) => {
      resolve(users.length)
    })
  })
}

function removeById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    User.remove({ _id: id }).exec((err, user) => {
      resolve()
    })
  })
}

// update
function update (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    User.find({ _id: id })
    .exec((err, user) => {
      User.update(
        { _id: id },
        { $set: {
          remote_id: getValid('remote_id', req, user),
          pid: getValid('pid', req, user),
          title: getValid('title', req, user),
          seq: getValid('seq', req, user),
          trash: getValid('trash', req, user),
          update_at: new Date(),
          need_push: req.need_push !== undefined ? req.need_push : true,
          tags: getValid('tags', req, user),
          top: getValid('top', req, user)
          }
        }
      ).exec((err, newUser) => {
        resolve(newUser)
      })
    })
  })
}

// get
function getAll () {
  return new Promise((resolve, reject) => {
    User.find({}).exec((err, users) => {
      resolve(users)
    })
  })
}

function getAllByPid (req) {
  const { pid } = req

  return new Promise((resolve, reject) => {
    User.find({ pid: pid }).exec((err, users) => {
      resolve(users)
    })
  })
}

function getById (req) {
  const { id } = req

  return new Promise((resolve, reject) => {
    User.findOne({ _id: id }).exec((err, user) => {
      resolve(user)
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
  getById
}