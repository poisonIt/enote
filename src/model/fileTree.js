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
    // this.isInit = true
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

    for (let i in this.map) {
      let file = this.map[i]
      if (!this.map[file.parent_folder]) {
        file.update({
          parent_folder: '/'
        })
      }
    }
    this.root.getAncestorFolders()
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
    // console.log('updateFile', data)
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
    let targetFolder = this.map[targetId]

    if (targetFolder.type !== 'folder') {
      console.error('target should not be a folder')
      return
    }
    if (targetFolder.ancestor_folders.indexOf(id) > -1) {
      console.error('target should not be a child')
      return
    }

    let oldParentFolder = file.parentFolder
    // let targetParentFolder = targetFolder.parent_folder
    // console.log('0000000', oldParentFolder, targetParentFolder)
    let oldTmp = oldParentFolder.child_folders
    let tmp = targetFolder.child_folders

    file.update({
      parent_folder: targetFolder.data.depth === 0 ? '/' : targetId
    })
    file.getAncestorFolders()
    oldTmp.splice(file.seq, 1)
    tmp.push(file)
    // if (file.parent_folder !== '/') {
    //   let tmp = targetFolder.child_folders

    //   // oldBroFolders = oldParentFolder.children.filter(item => item.seq > oldSeq)
    // } else {
    //   // oldBroFolders = rootFolders.filter(item => item.seq > oldSeq)
    // }

    // oldBroFolders
    //   .forEach(item => {
    //     item.update({
    //       seq: item.seq - 1
    //     })
    //   })

    // file.update({
    //   parent_folder: targetId || '/',
    //   seq: newSeq
    // })

    // if (targetId) {
    //   let targetFolder = this.map[targetId]
    //   if (targetFolder.ancestor_folders.indexOf(id) > -1) {
    //     console.error('target should not be a child')
    //     return
    //   }
    //   newSeq = targetFolder.children.length
    // } else {
    //   newSeq = rootFolders.length
    // }

    // if (file.parent_folder !== '/') {
    //   let oldParentFolder = this.map[file.parent_folder]
    //   oldBroFolders = oldParentFolder.children.filter(item => item.seq > oldSeq)
    // } else {
    //   oldBroFolders = rootFolders.filter(item => item.seq > oldSeq)
    // }

    // oldBroFolders
    //   .forEach(item => {
    //     item.update({
    //       seq: item.seq - 1
    //     })
    //   })

    // file.update({
    //   parent_folder: targetId || '/',
    //   seq: newSeq
    // })
    return this
  }

  moveFile (data) {
    let { id, broId, type } = data
    let file = this.map[id]
    let broFile = this.map[broId]
    let targetFolder = broFile.parentFolder || this.root
    let oldParentFolder = file.parentFolder || this.root
    // this.needUpdateFiles = [id]

    if (targetFolder === file || targetFolder.ancestor_folders.indexOf(id) > -1) {
      console.error('target should not be a child')
      return
    }

    if (targetFolder !== oldParentFolder) {
      let oldTmp = oldParentFolder.child_folders
      let tmp = targetFolder.child_folders
      oldTmp.splice(file.seq, 1)
      // this.needUpdateFiles.concat(oldTmp)
      if (type === 'before') {
        tmp.splice(tmp.indexOf(broFile), 0, file)
      } else {
        tmp.splice(tmp.indexOf(broFile) + 1, 0, file)
      }
      // this.needUpdateFiles.concat(tmp)
      file.update({
        parent_folder: targetFolder.data.depth === 0 ? '/' : targetFolder.id
      })
      oldParentFolder.child_folders = oldTmp
      targetFolder.child_folders = tmp
    } else {
      let tmp = targetFolder.child_folders
      tmp.splice(file.seq, 1)
      if (type === 'before') {
        tmp.splice(tmp.indexOf(broFile), 0, file)
      } else {
        tmp.splice(tmp.indexOf(broFile) + 1, 0, file)
      }
      targetFolder.child_folders = tmp
      // this.needUpdateFiles.concat(tmp)
    }

    return this
  }

  updateFlatMap (isLazy) {
    // this.flat_map = {}
    // console.log('updateFlatMap', isLazy)
    // this.root.getAncestorFolders()
    // let map = this.map
    let arr = isLazy ? this.arr.filter(item => item.need_push_locally) : this.arr
    // console.log('updateFlatMap-00000', arr)
    // for (let i in this.arr) {
    //   let item = this.arr[i]
    //   if (item.need_push_locally) {
    //     this.flat_map[item.id] = createFlatFile(item)
    //   }
    // }
    arr.forEach(item => {
      // console.log('2222222', item)
      this.flat_map[item.id] = createFlatFile(item)
    })
    // let map = !isLazy ? this.map : this.needUpdateFiles.map(item => this.map[item])
    // console.log('updateFlatMap', map)
    // for (let i in map) {
    //   let flat_file = createFlatFile(map[i])
    //   this.flat_map[i] = flat_file
    // }
    // if (this.isInit) {
    //   this.isInit = false
    // }
  }

  finishPushLocally (id) {
    this.map[id].need_push_locally = false
  }
}

function createFlatFile (file) {
  console.log('createFlatFile', file.title, file.id)
  // file.getAncestorFolders()
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
