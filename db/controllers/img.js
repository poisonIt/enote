const { remote } = require('electron')
const { imgsDB } = remote.app.database
import imgModel from '../models/img'

function getAll () {
  // imgsDB.remove({}, { multi: true }, (err, num) => { console.log('num', num) })
  return new Promise((resolve, reject) => {
    imgsDB.find({}, (err, docs) => {
      if (err) {
        console.error(err)
      } else {
        console.log('getAll-imgs', docs)
        resolve(docs)
      }
    })
  })
}

function add (req) {
  let { name, src, doc_id } = req
  return new Promise((resolve, reject) => {
    imgsDB.findOne({ src: src }, (err, imgDoc) => {
      if (imgDoc) {
        console.log('img-exist', imgDoc)
        resolve(imgDoc)
      } else {
        imgsDB.insert(imgModel(req), (err, newImg) => {
          if (err) {
            console.error(err)
          } else {
            resolve(newImg)
          }
        })
      }
    })
  })
}

function removeById (req) {
  const { id } = req
  return new Promise((resolve, reject) => {
    imgsDB.remove(
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

function removeBySrc (req) {
  const { src } = req
  return new Promise((resolve, reject) => {
    imgsDB.remove(
      { src: src },
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
  add,
  removeById,
  removeBySrc
}
