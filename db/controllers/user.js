import userModel from '../models/user'
const { remote } = require('electron')
const { userDB } = remote.app.database

function remove (files) {
  return new Promise((resolve, reject) => {
    userDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function get () {
  return new Promise((resolve, reject) => {
    userDB.find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection user_db:', docs)
        if (docs.length === 0) {
          userDB.insert(userModel({}), (err, newDoc) => {
            if (err) {
              console.error(err)
            } else {
              resolve(newDoc)
            }
          })
        } else {
          resolve(docs[0])
        }
      }
    })
  })
}

function update (opts) {
  return new Promise((resolve, reject) => {
    get().then(userDoc => {
      console.log('update-user', opts)
      userDB.update(
        {_id: userDoc._id},
        { $set: {
          username: opts.username !== undefined ? opts.username : userDoc.username,
          password: opts.password !== undefined ? opts.password : userDoc.password,
          oa_id: opts.oa_id !== undefined ? opts.oa_id : userDoc.oa_id,
          account_name_cn: opts.account_name_cn !== undefined ? opts.account_name_cn : userDoc.account_name_cn,
          image_url: opts.image_url !== undefined ? opts.image_url : userDoc.image_url,
          position_id: opts.position_id !== undefined ? opts.position_id : userDoc.position_id,
          position_name: opts.position_name !== undefined ? opts.position_name : userDoc.position_name,
          department_id: opts.department_id !== undefined ? opts.department_id : userDB.department_id,
          department_name: opts.department_name !== undefined ? opts.department_name : userDoc.department_name,
          friend_list: opts.friend_list !== undefined ? opts.friend_list : userDoc.friend_list,
          is_sync: opts.is_sync !== undefined ? opts.is_sync : userDoc.is_sync,
          access_token: opts.access_token !== undefined ? opts.access_token : userDoc.access_token,
          id_token: opts.id_token !== undefined ? opts.id_token : userDoc.id_token
        }},
        {
          returnUpdatedDocs: true
        },
        (err, num, newDocs) => {
          if (err) reject(err)
          resolve(newDocs)
        }
      )
    })
  })
}

export default {
  get,
  update,
  remove
}
