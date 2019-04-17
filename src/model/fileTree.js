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
      console.log('init-file', file.title, file.parent_folder)
      if (file.parent_folder !== '/' && !this.map[file.parent_folder]) {
        file.update({
          parent_folder: '/'
        }, true)
      }
    }
    this.root.getAncestorFolders()
    console.log('init-0', this.root)
    return this
  }

  addFile (data, isExist) {
    console.log('addFile', data.title, data.seq, data.remote_id, data._id)
    // return
    let newFile = new File({
      id: data._id,
      data: data,
      seq: data.seq,
      need_push_remotely: data.need_push,
      store: this,
      isExist: isExist
    })
    this.map[data._id] = newFile
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
    let targetFolder = this.map[targetId] || this.root
    let oldParentFolder = this.map[file.parent_folder] || this.root

    if (targetFolder.type !== 'folder') {
      console.error('target should not be a folder')
      return
    }

    if (file === targetFolder || file.children.indexOf(targetFolder) > -1) {
      console.error('target should not be a child')
      return
    }

    let oldSeq = file.seq

    oldParentFolder.children.splice(file.seq, 1)
    targetFolder.children.push(file)

    for (let i = file.seq, len = oldParentFolder.children.length; i < len; i++) {
      oldParentFolder.children[i].update({
        seq: i
      })
    }

    file.update({
      parent_folder: targetFolder.data.depth === 0 ? '/' : targetId,
      seq: targetFolder.children.length - 1
    }, true)

    // let oldParentFolder = file.parentFolder
    // // let targetParentFolder = targetFolder.parent_folder
    // // console.log('0000000', oldParentFolder, targetParentFolder)
    // let oldTmp = oldParentFolder.child_folders
    // let tmp = targetFolder.child_folders

    // file.update({
    //   parent_folder: targetFolder.data.depth === 0 ? '/' : targetId
    // }, true)
    // file.getAncestorFolders()

    // let relation = 0

    // if (oldTmp.indexOf(targetFolder) > -1) {
    //   relation = 1
    // } else if (tmp.indexOf(oldParentFolder) > -1) {
    //   relation = 2
    // }

    // oldTmp.splice(file.seq, 1)
    // tmp.push(file)
    
    // console.log('relation', relation, oldParentFolder, targetFolder, oldTmp, tmp, file.seq - 1, tmp.length - 1)
    // oldParentFolder.childSeqChangedIdxCache = relation === 2 ? -1 : file.seq - 1
    // targetFolder.childSeqChangedIdxCache = relation === 1 ? -1 : tmp.length - 1

    // oldParentFolder.child_folders = oldTmp
    // targetFolder.child_folders = tmp
  
    return this
  }

  moveFile (data) {
    let { id, broId, type } = data
    let file = this.map[id]
    let broFile = this.map[broId]
    let targetFolder = broFile.parentFolder || this.root
    let oldParentFolder = file.parentFolder || this.root
    // this.needUpdateFiles = [id]

    if (targetFolder === file || file.children.indexOf(targetFolder) > -1) {
      console.error('target should not be a child')
      return
    }

    let pos = type === 'before' ? broFile.seq - 1 : broFile.seq
    // if (targetFolder !== oldParentFolder) {
    oldParentFolder.children.splice(file.seq, 1)
    targetFolder.children.splice(pos, 0, file)

    if (targetFolder !== oldParentFolder) {
      for (let i = file.seq, len = oldParentFolder.children.length; i < len; i++) {
        oldParentFolder.children[i].update({
          seq: i
        })
      }
    } else {
      if (file.seq < broFile.seq) {
        pos = file.seq
      } else {
        pos = type === 'before' ? broFile.seq : broFile.seq + 1
      }
    }

    for (let i = pos, len = targetFolder.children.length; i < len; i++) {
      if (targetFolder.children[i] === file) {
        targetFolder.children[i].update({
          parent_folder: targetFolder.id,
          seq: i
        })
      } else {
        targetFolder.children[i].update({
          seq: i
        })
      }
    }



    
    // }
    

    

    // if (targetFolder !== oldParentFolder) {
    //   let oldTmp = oldParentFolder.child_folders
    //   let tmp = targetFolder.child_folders
    //   oldTmp.splice(file.seq, 1)
    //   oldParentFolder.childSeqChangedIdxCache = file.seq
    //   // this.needUpdateFiles.concat(oldTmp)
    //   if (type === 'before') {
    //     tmp.splice(tmp.indexOf(broFile), 0, file)
    //     targetFolder.childSeqChangedIdxCache = tmp.indexOf(broFile) - 1
    //   } else {
    //     tmp.splice(tmp.indexOf(broFile) + 1, 0, file)
    //     targetFolder.childSeqChangedIdxCache = tmp.indexOf(broFile)
    //   }
    //   // this.needUpdateFiles.concat(tmp)
    //   file.update({
    //     parent_folder: targetFolder.data.depth === 0 ? '/' : targetFolder.id
    //   }, true)
    //   oldParentFolder.child_folders = oldTmp
    //   targetFolder.child_folders = tmp
    // } else {
    //   let tmp = targetFolder.child_folders
    //   tmp.splice(file.seq, 1)
    //   if (type === 'before') {
    //     tmp.splice(tmp.indexOf(broFile), 0, file)
    //     targetFolder.childSeqChangedIdxCache = tmp.indexOf(broFile) - 1
    //   } else {
    //     tmp.splice(tmp.indexOf(broFile) + 1, 0, file)
    //     targetFolder.childSeqChangedIdxCache = tmp.indexOf(broFile)
    //   }
    //   targetFolder.child_folders = tmp
    //   // this.needUpdateFiles.concat(tmp)
    // }

    return this
  }

  updateFlatMap (isLazy) {
    // this.flat_map = {}
    console.log('updateFlatMap', isLazy)
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
    id: file.data._id,
    remote_id: file.data.remote_id,
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
