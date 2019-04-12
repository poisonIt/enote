import doc from './doc'
import docTemplate from '../docTemplate'
import fileModel from '../models/file'
import docModel from '../models/doc'
const { remote } = require('electron')
const { filesDB } = remote.app.database

function saveAll (files) {
  return new Promise((resolve, reject) => {
    filesDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      filesDB.insert({
        files: files
      }, (err, newDocs) => {
        if (err) reject(err)
        resolve(newDocs.files)
      })
    })
  })
}

function removeAll (files) {
  return new Promise((resolve, reject) => {
    filesDB.remove({}, { multi: true }, (err, numRemoved) => {
      if (err) reject(err)
      resolve(numRemoved)
    })
  })
}

function getAll () {
  return new Promise((resolve, reject) => {
    console.log('getAll')
    filesDB.find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        console.log('all documents in collection files_db:', docs)
        resolve(docs)
      }
    })
  })
}

// function getAll () {
//   return new Promise((resolve, reject) => {
//     console.log('getAll')
//     // filesDB.remove({}, { multi: true }, (err, numRemoved) => { console.log('numRemoved', numRemoved) })
//     filesDB.find({}, (err, files) => {
//       if (err) {
//         reject(err)
//       } else {
//         console.log('all documents in collection files_db:', files)
//         resolve(files)
//       }
//     })
//   })
// }

function add (opts) {
  return new Promise((resolve, reject) => {
    filesDB.insert(fileModel(opts), (err, newDoc) => {
      if (err) {
        console.error(err)
      } else {
        resolve(newDoc)
      }
    })
  })
}

function move (opts) {
  return new Promise((resolve, reject) => {
    const { fileId, targetId } = opts

    filesDB.findOne({ _id: fileId }, (err, file) => {
      if (err) {
        reject(err)
      } else {
        filesDB.findOne({ _id: targetId }, (err, targetFile) => {
          if (err) {
            reject(err)
          } else {
            if (targetId) {
              if (!targetFile) {
                reject(new Error('targetFile not exist'))
              } else {
                if (targetFile.type !== 'folder') {
                  reject(new Error('targetFile should be a folder'))
                }
              }
            }
            filesDB.update(
              { _id: fileId },
              { $set: {
                parent_folder: targetId || null,
                ancestor_folders: targetId ? [...targetFile.ancestor_folders, targetId] : []
              } }, {},
              () => {
                updateChildAndParent(file).then(() => {
                  updateTargetFile(file, targetId).then(() => {
                    resolve()
                  })
                })
              }
            )
          }
        })
      }
    })
  })
}

function updateChildAncestorFolders (file) {
  filesDB.update(
    { parent_folder: file._id },
    { $set: { ancestor_folders: [...file.ancestor_folders, file._id] } },
    {}, () => {})

  filesDB.find({ parent_folder: file._id }, (err, childFiles) => {
    if (err) console.error(err)
    childFiles.forEach(childFile => {
      updateChildAncestorFolders(childFile)
    })
  })
}

function updateChildAndParent (file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'folder') {
      updateChildAncestorFolders(file)
    }
    updateParentFile(file).then(() => {
      resolve()
    })
  })
}

function updateParentFile (file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'folder') {
      filesDB.update(
        { _id: file.parent_folder },
        { $pull: { child_folders: file._id } }, {},
        () => {
          resolve()
        }
      )
    } else if (file.type === 'doc') {
      filesDB.update(
        { _id: file.parent_folder },
        { $pull: { child_docs: file._id } }, {},
        () => {
          resolve()
        }
      )
    }
  })
}

function updateTargetFile (file, targetId) {
  return new Promise((resolve, reject) => {
    if (file.type === 'folder') {
      filesDB.update(
        { _id: targetId },
        { $push: { child_folders: file._id } }, {},
        () => {
          resolve()
        }
      )
    } else if (file.type === 'doc') {
      filesDB.update(
        { _id: targetId },
        { $push: { child_docs: file._id } }, {},
        () => {
          resolve()
        }
      )
    }
  })
}

function updateTitle (opts) {
  return new Promise((resolve, reject) => {
    const { id, val } = opts
    filesDB.update(
      { _id: id },
      { $set: { title: val } },
      { upsert: false },
      (err, docs) => {
        if (err) {
          reject(err)
        }
        resolve()
      }
    )
  })
}

function updateDiscarded (opts) {
  console.log('updateDiscarded', opts)
  return new Promise((resolve, reject) => {
    const { id, discarded } = opts
    if (typeof discarded !== 'boolean') reject(new Error('type error'))
    filesDB.update(
      { _id: id },
      { $set: { discarded: discarded } },
      {},
      (err, docs) => {
        if (err) reject(err)
        filesDB.findOne({ _id: id }, (err, file) => {
          if (err) reject(err)
          let childs = []
          file.child_docs && file.child_docs.forEach(id => childs.push(id))
          file.child_docs && file.child_folders.forEach(id => childs.push(id))
          if (childs.length === 0) resolve()
          Promise.all(childs.map(id => {
            return updateDiscarded({
              id: id,
              discarded: discarded
            })
          })).then(() => {
            resolve()
          })
        })
      }
    )
  })
}

function updateContent (opts) {
  return new Promise((resolve, reject) => {
    const { id, content } = opts

    // filesDB.update(
    //   { _id: id },
    //   { $set: {
    //     content: content,
    //     file_size: content.length
    //   }},
    //   {
    //     returnUpdatedDocs: true
    //   },
    //   (err, num, doc) => {
    //     if (err) reject(err)
    //     console.log('docs', doc)
    //     resolve(doc)
    //   }
    // )

    filesDB.findOne({ _id: id }, (err, file) => {
      if (err) reject(err)
      if (!file) {
        resolve()
      }
      console.log('updateContent', id, file)
      if (file.type === 'doc') {
        // doc.update({
        //   id: file.doc_id,
        //   content: content
        // }).then(() => {
        //   filesDB.update(
        //     { _id: id },
        //     { $set: { file_size: content.length } },
        //     {},
        //     (err, docs) => {
        //       if (err) {
        //         reject(err)
        //       } else {
        //         resolve(docs)
        //       }
        //     })
        // })
      }
    })
  })
}

function update (opts) {
  const { id, data } = opts

  return new Promise((resolve, reject) => {
    filesDB.findOne({ _id: id }, (err, fileDoc) => {
      if (err) {
        reject(err)
      } else {
        console.log('update-fileDoc', fileDoc)

        filesDB.update(
          { _id: id },
          { $set: {
            title: data.title || fileDoc.title,
            update_at: new Date(),
            file_size: data.file_size || fileDoc.file_size,
            file_path: data.file_path || fileDoc.file_path,
            parent_folder: data.parent_folder || fileDoc.parent_folder,
            content: data.content || fileDoc.content,
            need_push: true
          }},
          {
            returnUpdatedDocs: true
          },
          (err, num, docs) => {
            if (err) reject(err)
            console.log('update-files', docs)
            resolve(docs)
          }
        )
      }
    })
  })
 
}

export default {
  getAll,
  add,
  move,
  updateTitle,
  updateDiscarded,
  updateContent,
  saveAll,
  removeAll,
  update
}
