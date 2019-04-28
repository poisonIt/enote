import tagModel from '../models/tag'
const { remote } = require('electron')
const db = remote.app.database

function getAll () {
  // db.tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  return new Promise((resolve, reject) => {
    db.tagsDB.find({
      trash: 'NORMAL'
    }, (err, docs) => {
      if (err) {
        console.error(err)
      } else {
        console.log('getAll-tags', docs)
        resolve(docs)
      }
    })
  })
}

function getAllTrash () {
  console.log('getAllTrash')
  // db.tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  return new Promise((resolve, reject) => {
    db.tagsDB.find({
      trash: 'TRASH'
    }, (err, docs) => {
      if (err) {
        console.error(err)
      } else {
        console.log('getAll-trash-tags', docs)
        resolve(docs)
      }
    })
  })
}

function removeAll (files) {
  return new Promise((resolve, reject) => {
    db.tagsDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getById (id) {
  // db.tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    db.tagsDB.findOne({ _id: id }, (err, doc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(doc)
      }
    })
  })
}

function getByName (name) {
  // db.tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    db.tagsDB.findOne({ name: name }, (err, doc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(doc)
      }
    })
  })
}

function getByFileId (fileId) {
  // db.tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    console.log('333', fileId, this)
    db.tagsDB.find({
      file_ids: {
        $elemMatch: fileId
      }},
      function (err, docs) {
        // docs with more than 6 properties
        resolve(docs)
      }
    )
    // db.tagsDB.find({ name: name }, (err, doc) => {
    //   if (err) {
    //     console.error(err)
    //   } else {
    //     resolve(doc)
    //   }
    // })
  })
}

// function get (id) {
//   return new Promise((resolve, reject) => {
//     db.tagsDB.findOne({ _id: id }, (err, doc) => {
//       if (err) {
//         console.error(err)
//       } else {
//         resolve(doc.content)
//       }
//     })
//   })
// }

function add (opts) {
  let { name, remote_id } = opts
  return new Promise((resolve, reject) => {
    db.tagsDB.findOne({ name: name }, (err, tagDoc) => {
      console.log('tagDoc-exist', tagDoc, remote_id)
      if (tagDoc) {
        if (remote_id && tagDoc.remote_id !== remote_id) {
          db.tagsDB.update(
            { _id: tagDoc._id },
            { $set: {
              remote_id: remote_id
            }},
            {
              returnUpdatedDocs: true
            },
            (err, num, tags) => {
              if (err) reject(err)
              resolve(tags[0])
            }
          )
        } else {
          resolve(tagDoc)
        }
      } else {
        db.tagsDB.insert(tagModel(opts), (err, newTag) => {
          if (err) {
            console.error(err)
          } else {
            resolve(newTag)
          }
        })
      }
    })
  })
}

// function add (content) {
//   return new Promise((resolve, reject) => {
//     db.tagsDB.insert({ content: content }, (err, newDoc) => {
//       if (err) {
//         console.error(err)
//       } else {
//         resolve(newDoc._id)
//       }
//     })
//   })
// }

function addFile (req) {
  const { fileId, tagId } = req
  return new Promise((resolve, reject) => {
    db.tagsDB.update(
      { _id: tagId },
      { $push: { file_ids: fileId } },
      {},
      (err, docs) => {
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

function removeFile (req) {
  const { fileId, tagId } = req
  return new Promise((resolve, reject) => {
    db.tagsDB.update(
      { _id: tagId },
      { $pull: { file_ids: fileId } },
      {
        returnUpdatedDocs: true
      },
      (err, num, doc) => {
        if (err) {
          reject(err)
        }
        console.log('0000', doc)
        resolve(doc._id)
      }
    )
  })
}

function update (opts) {
  const { id, data } = opts
  console.log('update-local', id, opts.data)

  return new Promise((resolve, reject) => {
    db.tagsDB.findOne({ _id: id }, (err, tagDoc) => {
      if (err) {
        reject(err)
      } else {
        // console.log('update-tagDoc', tagDoc, data)
        db.tagsDB.update(
          { _id: id },
          { $set: {
            remote_id: data.remote_id !== undefined ? data.remote_id : tagDoc.remote_id
          }},
          {
            returnUpdatedDocs: true
          },
          (err, num, docs) => {
            if (err) reject(err)
            resolve(docs)
          }
        )
      }
    })
  })
}

function deleteById (req) {
  const { id } = req
  return new Promise((resolve, reject) => {
    db.tagsDB.update(
      { _id: id },
      { $set: {
        trash: 'TRASH'
      }},
      {
        returnUpdatedDocs: true
      },
      (err, num, docs) => {
        if (err) reject(err)
        resolve(docs)
      }
    )
  })
}

function resumeById (req) {
  const { id } = req
  return new Promise((resolve, reject) => {
    db.tagsDB.update(
      { _id: id },
      { $set: {
        trash: 'NORMAL'
      }},
      {
        returnUpdatedDocs: true
      },
      (err, num, docs) => {
        if (err) reject(err)
        resolve(docs)
      }
    )
  })
}

function removeById (req) {
  const { id } = req
  return new Promise((resolve, reject) => {
    db.tagsDB.remove(
      { _id: id },
      {},
      (err, numRemoved) => {
        if (err) {
          reject(err)
        }
        resolve(numRemoved)
      }
    )
  })
}

export default {
  getAll,
  getAllTrash,
  removeAll,
  getById,
  getByName,
  getByFileId,
  add,
  // addFile,
  update,
  removeFile,
  deleteById,
  resumeById,
  removeById
}
