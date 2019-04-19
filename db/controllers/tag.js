const { remote } = require('electron')
const { tagsDB } = remote.app.database
import tagModel from '../models/tag'

function getAll () {
  // tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  return new Promise((resolve, reject) => {
    tagsDB.find({}, (err, docs) => {
      if (err) {
        console.error(err)
      } else {
        console.log('getAll-tags', docs)
        resolve(docs)
      }
    })
  })
}

function removeAll () {
  return new Promise((resolve, reject) => {
    tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  })
}

function getById (id) {
  // tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    tagsDB.findOne({ _id: id }, (err, doc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(doc)
      }
    })
  })
}

function getByName (name) {
  // tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    tagsDB.findOne({ name: name }, (err, doc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(doc)
      }
    })
  })
}

function getByFileId (fileId) {
  // tagsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    console.log('333', fileId, this)
    tagsDB.find({
      file_ids: {
        $elemMatch: fileId
      }},
      function (err, docs) {
        // docs with more than 6 properties
        resolve(docs)
      }
    )
    // tagsDB.find({ name: name }, (err, doc) => {
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
//     tagsDB.findOne({ _id: id }, (err, doc) => {
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
    tagsDB.findOne({ name: name }, (err, tagDoc) => {
      console.log('tagDoc-exist', tagDoc, remote_id)
      if (tagDoc) {
        if (remote_id && tagDoc.remote_id !== remote_id) {
          tagsDB.update(
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
        tagsDB.insert(tagModel(opts), (err, newTag) => {
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
//     tagsDB.insert({ content: content }, (err, newDoc) => {
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
    tagsDB.update(
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
    tagsDB.update(
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

// function update (obj) {
//   const { id, content } = obj
//   return new Promise((resolve, reject) => {
//     tagsDB.find({ _id: id }, (err, docs) => {
//       console.log('update-get', docs)
//     })
//     tagsDB.update(
//       { _id: id },
//       { $set: { content: content } },
//       {},
//       (err, docs) => {
//         console.log('2222222', docs)
//         if (err) {
//           reject(err)
//         }
//         resolve()
//       }
//     )
//   })
// }

function remove (req) {
  const { name } = req
  return new Promise((resolve, reject) => {
    tagsDB.remove(
      { name: name },
      {},
      (err, numRemoved) => {
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

export default {
  getAll,
  removeAll,
  getById,
  getByName,
  getByFileId,
  add,
  addFile,
  removeFile,
  remove
}
