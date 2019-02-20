const { remote } = require('electron')
const { structureDB } = remote.app.database

function save (files) {
  return new Promise((resolve, reject) => {
    structureDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      structureDB.insert({
        files: files
      }, (err, newDocs) => {
        if (err) reject(err)
        resolve(newDocs.files)
      })
    })
  })
}

function get () {
  return new Promise((resolve, reject) => {
    console.log('get')
    // structureDB.remove({}, { multi: true }, (err, numRemoved) => { console.log('numRemoved', numRemoved) })
    // return
    structureDB.find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection structure_db:', docs)
        resolve(docs[0] ? docs[0].files : '{}')
      }
    })
  })
}

export default {
  save,
  get
}
