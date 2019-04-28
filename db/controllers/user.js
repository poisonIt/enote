import userModel from '../models/user'
const { remote } = require('electron')
const db = remote.app.database
console.log('remote', remote)

function getAll () {
  return new Promise((resolve, reject) => {
    db.userDB.find({}, (err, users) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection user_db:', users)
        resolve(users)
      }
    })
  })
}

function getById (req) {
  const { id } = req
  return new Promise((resolve, reject) => {
    db.userDB.findOne({ _id: id }, (err, user) => {
      if (err) {
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}

function getByUserCode (req) {
  const { usercode } = req
  return new Promise((resolve, reject) => {
    db.userDB.findOne({ usercode: usercode }, (err, user) => {
      if (err) {
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}

function removeAll () {
  return new Promise((resolve, reject) => {
    db.userDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function removeById (req) {
  const { id } = req
  return new Promise((resolve, reject) => {
    db.userDB.remove({ _id: id }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function add (opts) {
  return new Promise((resolve, reject) => {
    db.userDB.insert(userModel(opts), (err, newDoc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(newDoc)
      }
    })
  })
}

function update (opts) {
  const { usercode } = opts
  console.log('update', opts)
  return new Promise((resolve, reject) => {
    getByUserCode({ usercode: usercode }).then(userDoc => {
      console.log('userDoc', userDoc)
      if (!userDoc) {
        add(opts).then(newUser => resolve(newUser))
      } else {
        db.userDB.update(
          {_id: userDoc._id},
          { $set: {
            username: opts.username !== undefined ? opts.username : userDoc.username,
            // usercode: opts.usercode !== undefined ? opts.usercode : userDoc.usercode,
            password: opts.password !== undefined ? opts.password : userDoc.password,
            oa_id: opts.oa_id !== undefined ? opts.oa_id : userDoc.oa_id,
            account_name_cn: opts.account_name_cn !== undefined ? opts.account_name_cn : userDoc.account_name_cn,
            image_url: opts.image_url !== undefined ? opts.image_url : userDoc.image_url,
            position_id: opts.position_id !== undefined ? opts.position_id : userDoc.position_id,
            position_name: opts.position_name !== undefined ? opts.position_name : userDoc.position_name,
            department_id: opts.department_id !== undefined ? opts.department_id : db.userDB.department_id,
            department_name: opts.department_name !== undefined ? opts.department_name : userDoc.department_name,
            friend_list: opts.friend_list !== undefined ? opts.friend_list : userDoc.friend_list,
            is_sync: opts.is_sync !== undefined ? opts.is_sync : userDoc.is_sync,
            access_token: opts.access_token !== undefined ? opts.access_token : userDoc.access_token,
            id_token: opts.id_token !== undefined ? opts.id_token : userDoc.id_token
          }},
          {
            returnUpdatedDocs: true
          },
          (err, num, newUser) => {
            if (err) reject(err)
            resolve(newUser)
          }
        )
        console.log('update-user', opts)
      }
    })
  })
}

export default {
  getAll,
  getById,
  removeAll,
  removeById,
  add,
  update
}
