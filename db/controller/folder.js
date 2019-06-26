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
    depth: {
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
      if (err) {
        reject(err)
      }
      resolve(folders)
    })
  })
}

// add
async function add (req) {
  let data = folderModel(req)

  return new Promise((resolve, reject) => {
    let query
    if (req.hasOwnProperty('pid')) {
      query = { id: req.pid }
      if (req.hasOwnProperty('remote_pid')) {
        query = [
          { id: req.pid },
          { remote_id: req.remote_pid }
        ]
      }
    } else {
      if (req.hasOwnProperty('remote_pid')) {
        query = { remote_id: req.remote_pid }
        Folder.insert(data, function (err, newFolder) {
          if (err) {
            reject(err)
          }
          resolve(newFolder)
        })
        return
      } else {
        query = { id: '0' }
      }
    }
    getByQuery(query).then(pFolder => {
      if (pFolder && pFolder.remote_id) {
        data.remote_pid = pFolder.remote_id
      }
      if (!pFolder) {
        data.pid = '0'
        data.remote_pid = '0'
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

  let result

  let p = folders.map(f => {
    return removeById({ id: f._id })
  })

  await Promise.all(p)

  if (folder) {
    req.id = folder._id
    result = await update(req)
  } else {
    result = await add(req)
  }

  return result
}

async function diffAddMulti (reqs) {
  let newFolders = await Promise.all(reqs.map(req => diffAdd(req)))
  let p = newFolders.map((folder, index) => {
    return (async () => {
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
  let result = await Promise.all(p)
  return result
}

// remove
function removeAll () {
  return new Promise((resolve, reject) => {
    Folder.find({}, (err, folders) => {
      if (err) {
        reject(MediaError)
      }
      folders.forEach(folder => {
        folder.remove()
      })
      resolve(folders.length)
    })
  })
}

async function removeById (req) {
  const { id } = req
  let folder = await getById({ id: id })
  folder && folder.remove()
}

async function removeAllDeleted () {
  let result
  let folders = await getByQuery({ trash: 'DELETED' }, { multi: true })

  let p = folders.map(folder => {
    return (async () => {
      await folder.remove()
      return folder
    })(folder)
  })

  result = await Promise.all(p)
  return result
}

function deleteAll () {
  return new Promise((resolve, reject) => {
    Folder.find({}).exec((err, folders) => {
      if (err) {
        reject(err)
      }
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
  let newFolder
  req.update_at = new Date().valueOf()

  if (!req.hasOwnProperty('need_push')) {
    req.need_push = true
  }

  if (req.hasOwnProperty('pid')) {
    let pFolder = await getById({ id: req.pid })
    req.remote_pid = pFolder ? pFolder.remote_id : '0'
  }

  let folder = await getById({ id: id })
  if (!folder) {
    newFolder = await updateByQuery({
      query: { remote_id: id },
      data: req
    })
  } else {
    let oldRemoteId = folder.remote_id
    let oldTrash = folder.trash
    newFolder = await updateP(
      { _id: id },
      { $set: req }
    )

    let childData = {}
    if (req.trash === 'DELETED') {
      childData.trash = 'DELETED'
    }
    if (newFolder.remote_id !== oldRemoteId) {
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
    }

    // may cause performce issure
    if (req.trash === 'NORMAL' && oldTrash !== 'NORMAL') {
      if (newFolder.pid !== '0') {
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
  return new Promise((resolve, reject) => {
    Folder.find({}, (err, folders) => {
      resolve(folders)
    })
  })
  // return await getByQuery({}, { multi: true })
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
    if (opts.sort) {
      queryFunc = queryFunc.sort(opts.sort)
    }
    if (typeof opts.limit === 'number') {
      queryFunc = queryFunc.limit(opts.limit)
    }
    folders = await queryFunc.execAsync()
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
  let pFolder
  if (_.isUndefined(folder.remote_pid)) {
    pFolder = await getByQuery({ _id: folder.pid })
  } else {
    pFolder = await getByQuery([
      { _id: folder.pid },
      { remote_id: folder.remote_pid }]
    )
  }
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
