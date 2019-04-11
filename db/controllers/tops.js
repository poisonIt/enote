const { remote } = require('electron')
const { topsDB } = remote.app.database

function save (files) {
  return new Promise((resolve, reject) => {
    topsDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      topsDB.insert({
        files: files
      }, (err, newDocs) => {
        if (err) reject(err)
        resolve(newDocs.files)
      })
    })
  })
}

function remove () {
  return new Promise((resolve, reject) => {
    topsDB.remove({}, { multi: true }, (err, numRemoved) => { console.log('numRemoved', numRemoved) })
  })
}
 
function get () {
  return new Promise((resolve, reject) => {
    topsDB.find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection tops_db:', docs)
        resolve(docs[0] ? docs[0].files : [])
      }
    })
  })
}

export default {
  save,
  remove,
  get
}
