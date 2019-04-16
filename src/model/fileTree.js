import File from './file'

export default class FileTree {
  constructor (options) {
    for (let name in options) {
      if (options.hasOwnProperty(name)) {
        this[name] = options[name]
      }
    }

    this.map = {}
    this.arr = []
    this.flat_map = {}
    this.isInit = true
    this.root = new File({
      data: {
        title: '我的文件夹',
        type: 'folder',
        depth: 0
      },
      store: this
    })
  }

  init (data) {
    data.forEach(item => {
      this.addFile(item, true)
    })
    return this
  }

  addFile (data, isExist) {
    console.log('addFile', data)
    let newFile = new File({
      id: data.remote_id || data._id,
      data: data,
      seq: data.seq,
      need_push_remotely: data.need_push,
      store: this,
      isExist: isExist
    })
    this.map[data.remote_id || data._id] = newFile
    this.arr.push(newFile)
    return this
  }

  updateFile (data, lazy) {
    console.log('updateFile', data)
    let file = this.map[data.id]
    file.update(data)
    if (!lazy) {
      this.updateFlatMap()
    }
    return this
  }

  appendFile (data) {
    let { id, targetId } = data
    let file = this.map[id]
    let newSeq = 0
    let oldSeq = file.seq || 0
    let oldBroFolders = []
    let rootFolders = this.arr.filter(item => item.parent_folder === '/')

    if (targetId) {
      let targetFolder = this.map[targetId]
      if (targetFolder.getAncestorFolders().indexOf(id) > -1) {
        console.error('target should not be a child')
        return
      }
      newSeq = targetFolder.children.length
    } else {
      newSeq = rootFolders.length
    }

    if (file.parent_folder !== '/') {
      let oldParentFolder = this.map[file.parent_folder]
      oldBroFolders = oldParentFolder.children.filter(item => item.seq > oldSeq)
    } else {
      oldBroFolders = rootFolders.filter(item => item.seq > oldSeq)
    }

    oldBroFolders
      .forEach(item => {
        item.update({
          seq: item.seq - 1
        })
      })

    file.update({
      parent_folder: targetId || '/',
      seq: newSeq
    })
    return this
  }

  moveFile (data) {
    let { id, broId, type } = data
    let file = this.map[id]
    let broFile = this.map[broId]
    let targetFolder = broFile.parentFolder || this.root
    let oldParentFolder = file.parentFolder || this.root

    if (targetFolder === file || targetFolder.getAncestorFolders().indexOf(id) > -1) {
      console.error('target should not be a child')
      return
    }
     
    if (targetFolder !== oldParentFolder) {
      let oldTmp = oldParentFolder.child_folders
      let tmp = targetFolder.child_folders
      oldTmp.splice(file.seq, 1)
      if (type === 'before') {
        tmp.splice(tmp.indexOf(broFile.id), 0, file.id)
      } else {
        tmp.splice(tmp.indexOf(broFile.id) + 1, 0, file.id)
      }
      file.update({
        parent_folder: targetFolder.data.depth === 0 ? '/' : targetFolder.id
      })
      oldParentFolder.child_folders = oldTmp
      targetFolder.child_folders = tmp
    } else {
      let tmp = targetFolder.child_folders
      tmp.splice(file.seq, 1)
      if (type === 'before') {
        tmp.splice(tmp.indexOf(broFile.id), 0, file.id)
      } else {
        tmp.splice(tmp.indexOf(broFile.id) + 1, 0, file.id)
      }
      targetFolder.child_folders = tmp
    }

    return this
  }

  updateFlatMap () {
    this.flat_map = {}
    this.root.getAncestorFolders()
    for (let i in this.map) {
      let flat_file = createFlatFile(this.map[i], this.isInit)
      this.flat_map[i] = flat_file
    }
    if (this.isInit) {
      this.isInit = false
    }
  }

  finishPushLocally (id) {
    this.map[id].need_push_locally = false
  }
}

function createFlatFile (file, isInit) {
  console.log('createFlatFile', file)
  file.getAncestorFolders()
  return {
    id: file.id,
    cache_id: file.cache_id,
    type: file.type,
    seq: file.seq,
    title: file.title,
    parent_folder: file.parent_folder,
    ancestor_folders: file.ancestor_folders,
    trash: file.trash,
    link: file.link,
    create_at: file.create_at,
    update_at: file.update_at,
    need_push_locally: file.need_push_locally,
    need_push_remotely: file.need_push_remotely,
    children: file.children,
    child_folders: file.child_folders,
    child_docs: file.child_docs,
    content: file.content,
    file_size: file.file_size
  }
}
