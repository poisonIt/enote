import * as _ from 'lodash'
import { promisifyAll } from '../promisify'
import { isIllegal } from '../tools'
import folderModel from '../models/folder'
import { LinvoDB } from '../index'
import noteCtr from './note'

let schemaKeys = Object.keys(folderModel({}))
let Folder = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  Folder = new LinvoDB(`folder`, {
    type: {
      type: String,
      default: 'folder'
    },
    remote_id: {
      type: String
    },
    pid: {
      type: String,
      default: '0'
    },
    remote_pid: {
      type: String
    },
    title: {
      type: String,
      default: '新建文件夹'
    },
    seq: {
      type: Number,
      default: 0
    },
    create_at: Date,
    update_at: Date,
    trash: {
      type: String,
      default: 'NORMAL'
    },
    need_push: {
      type: Boolean,
      default: true
    },
    tags: [String],
    top: {
      type: Boolean,
      default: false
    }
  })
  promisifyAll(Folder)
}


function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    Folder.save(data, (err, folders) => {
      resolve(folders)
    })
  })
}

// add
async function add (req) {
  let data = folderModel(req)

  return new Promise((resolve, reject) => {
    getById({ id: req.pid }).then(pFolder => {
      if (pFolder && pFolder.remote_id) {
        data.remote_pid = pFolder.remote_id
      }
      Folder.insert(data, function (err, newFolder) {
        if (err) {
          reject(err)
        }
        resolve(newFolder)
      })
    })
  })
}

async function diffAdd (req) {
  let folders = await getByQuery({ remote_id: req.remote_id }, { multi: true })

  let folder = folders.shift()

  let p = folders.map(f => {
    return removeById({ id: f._id })
  })

  await Promise.all(p)

  if (folder) {
    req.id = folder._id
    return await update(req)
  } else {
    return await add(req)
  }
}

async function diffAddMulti (reqs) {
  let newFolders = await Promise.all(reqs.map(req => diffAdd(req)))
  let p = newFolders.map((folder, index) => {
    return (async () => {
      return folder
      let newFolder = folder
      let pL = await getByQuery({ id: folder.pid })
      let pR = await getByQuery({ remote_id: folder.remote_pid })
      if (pR) {
        if (pL) {
          if (pL._id !== pR._id) {
            newFolder = await update({ id: folder._id, pid: pR._id })
          }
        } else {
          newFolder = await update({ id: folder._id, pid: pR._id })
        }
      } else {
        newFolder = await update({ id: folder._id, pid: '0' })
      }
      return newFolder
    })(folder, index)
  })
  return await Promise.all(p)
}

// remove
function removeAll () {
  console.log('removeAll-folder')
  return new Promise((resolve, reject) => {
    Folder.find({}, (err, folders) => {
      folders.forEach(folder => {
        folder.remove()
      })
      resolve(folders.length)
    })
  })
}

async function removeById (req) {
  console.log('removeById-folder')
  const { id } = req
  let folder = await getById({ id: id })
  folder && folder.remove()
}

async function removeAllDeleted () {
  console.log('removeAllDeleted-folder')
  let folders = await getByQuery({ trash: 'DELETED' }, { multi: true })

  let p = folders.map(folder => {
    return (async () => {
      await folder.remove()
      return folder
    })(folder)
  })

  return await Promise.all(p)
}

function deleteAll () {
  return new Promise((resolve, reject) => {
    Folder.find({}).exec((err, folders) => {
      let p = folders.map(folder => {
        return update({
          id: folder._id,
          trash: 'DELETED'
        })
      })
      Promise.all(p).then(() => {
        resolve(folders.length)
      })
    })
  })
}

function updateP (query, req, multi) {
  return new Promise((resolve, reject) => {
    Folder.update(
      query,
      req,
      { multi: true },
      (err, num, newFolders) => {
        if (err) {
          reject(err)
        }
        resolve(newFolders)
      }
    )
  })
}

// update
async function update (req) {
  const { id } = req

  if (!req.hasOwnProperty('need_push')) {
    req.need_push = true
  }

  if (req.hasOwnProperty('pid')) {
    let pFolder = await getById({ id: req.pid })
    req.remote_pid = pFolder ? pFolder.remote_id : '0'
  }

  let folder = await getById({ id: id })
  if (!folder) {
    return await updateByQuery({
      query: { remote_id: id },
      data: req
    })
  } else {
    let old_remote_id = folder.remote_id
    let old_trash = folder.trash
    let newFolder = await updateP(
      { _id: id },
      { $set: req }
    )

    let childData = {}
    if (req.trash === 'DELETED') {
      childData.trash = 'DELETED'
    }
    if (newFolder.remote_id !== old_remote_id) {
      childData.remote_pid = newFolder.remote_id
    }
    if (childData.hasOwnProperty('trash') || childData.hasOwnProperty('remote_pid')) {
      await updateByQuery({
        query: { pid: newFolder._id },
        data: childData
      })
      await noteCtr.updateByQuery({
        query: { pid: newFolder._id },
        data: childData
      })
      if (req.trash === 'NORMAL' && old_trash !== newFolder.trash) {
        await update({
          id: newFolder.pid,
          trash: 'NORMAL'
        })
      }
    }
    return newFolder
  }
}

async function updateByQuery (req) {
  const { query, data } = req
  data.need_push = true

  let folders = await getByQuery(query, { multi: true })

  let p = folders.map(folder => {
    let r = {}
    for (let i in data) {
      r[i] = data[i]
    }
    r.id = folder._id
    return update(r)
  })

  return await Promise.all(p)
}

async function updateMulti (reqs) {
  let p = reqs.map(req => {
    return update(req)
  })

  return await Promise.all(p)
}

// get
async function getAll () {
  return await getByQuery({}, { multi: true })
}

async function getAllByPid (req) {
  const { pid, remote_pid } = req

  let querys = []
  if (!_.isUndefined(pid)) {
    querys.push({ pid: pid })
  }
  if (!_.isUndefined(remote_pid)) {
    querys.push({ remote_pid: remote_pid })
  }

  return await getByQuery(
    querys,
    { multi: true, with_parent_folder: true }
  )
}

async function getById (req) {
  const { id } = req

  let folder = await getByQuery({ _id: id })
  return folder
}

async function getTrash () {
  let folders = await getByQuery(
    { trash: 'TRASH' },
    { multi: true, with_parent_folder: true }
  )
  return folders
}

async function getByQuery (params, opts) {
  opts = opts || {
    multi: false,
    with_parent_folder: false
  }
  const isReqArr = _.isArray(params)
  const query = isReqArr ? { $or: params } : params
  
  let folders = []
  if (opts.multi) {
    let queryFunc = Folder.find(query)
    if (opts.limit) {
      queryFunc = queryFunc.limit(opts.limit)
    }
    if (opts.sort) {
      queryFunc = queryFunc.sort(opts.sort)
    }
    let folders = await queryFunc.execAsync()
  } else {
    let folder = await Folder.findOne(query).execAsync()
    if (folder) {
      folders.push(folder)
    }
  }

  // clear illegal data
  // folders.forEach((folder, index) => {
  //   if (isIllegal(schemaKeys, folder)) {
  //     console.log('isIllegal', folder)
  //     folder.remove()
  //     _.remove(folders, folder)
  //   }
  // })

  if (opts.with_parent_folder) {
    folders = await Promise.all(folders.map(folder => {
      return patchParentFolder(folder)
    }))
  }
  
  return opts.multi ? folders : folders[0]
}

async function patchParentFolder (folder) {
  let pFolder = await getByQuery([
    { _id: folder.pid },
    { remote_id: folder.remote_pid }]
  )
  if (pFolder) {
    folder.parent_folder = pFolder
    if (folder.pid !== pFolder._id) {
      folder.pid = pFolder._id
      await update({ id: folder._id, pid: pFolder._id })
    }
  } else {
    folder.parent_folder = null
    if (folder.pid !== '0') {
      folder.pid = '0'
      await update({ id: folder._id, pid: '0' })
    }
  }
  return folder
}

export default {
  createCollection,
  saveAll,
  add,
  diffAdd,
  diffAddMulti,
  removeAll,
  removeById,
  removeAllDeleted,
  deleteAll,
  update,
  updateByQuery,
  updateMulti,
  getAll,
  getAllByPid,
  getById,
  getByQuery,
  getTrash
}
