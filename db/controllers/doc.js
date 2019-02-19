// import files from './files'
const { remote } = require('electron')
const { docsDB } = remote.app.database

function getAll () {
  // docsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  return new Promise((resolve, reject) => {
    docsDB.find({}, (err, docs) => {
      if (err) {
        console.error(err)
      } else {
        console.log('getAll-docs', docs)
        resolve(docs)
      }
    })
  })
}

function get (id) {
  // docsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  // return
  return new Promise((resolve, reject) => {
    docsDB.findOne({ file_id: id }, (err, doc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(doc.content)
      }
    })
  })
}

// function get (id) {
//   return new Promise((resolve, reject) => {
//     docsDB.findOne({ _id: id }, (err, doc) => {
//       if (err) {
//         console.error(err)
//       } else {
//         resolve(doc.content)
//       }
//     })
//   })
// }

function add (req) {
  const { fileId, content } = req
  return new Promise((resolve, reject) => {
    docsDB.insert({
      file_id: fileId,
      content: content
    }, (err, newDoc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(newDoc._id)
      }
    })
  })
}

// function add (content) {
//   return new Promise((resolve, reject) => {
//     docsDB.insert({ content: content }, (err, newDoc) => {
//       if (err) {
//         console.error(err)
//       } else {
//         resolve(newDoc._id)
//       }
//     })
//   })
// }

function update (req) {
  const { fileId, content } = req
  return new Promise((resolve, reject) => {
    docsDB.update(
      { file_id: fileId },
      { $set: { content: content } },
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

// function update (obj) {
//   const { id, content } = obj
//   return new Promise((resolve, reject) => {
//     docsDB.find({ _id: id }, (err, docs) => {
//       console.log('update-get', docs)
//     })
//     docsDB.update(
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
  const { fileId } = req
  return new Promise((resolve, reject) => {
    docsDB.remove(
      { file_id: fileId },
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
  get,
  add,
  update,
  remove
}
