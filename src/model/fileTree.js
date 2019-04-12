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
      this.addFile(item)
    })

    this.updateFlatMap()
  }

  addFile (data) {
    let newFile = new File({
      id: data._id,
      data: data,
      need_push_remotely: data.need_push,
      store: this
    })
    this.map[data._id] = newFile
    this.arr.push(newFile)
    this.updateFlatMap()
    return newFile
  }

  updateFile (data) {
    let file = this.map[data.id]
    file.update(data)
    this.updateFlatMap()
    return file
  }

  updateFlatMap () {
    this.flat_map = {}
    for (let i in this.map) {
      let flat_file = createFlatFile(this.map[i])
      this.flat_map[i] = flat_file
    }
  }

  finishPushLocally (id) {
    this.map[id].need_push_locally = false
  }
}

function createFlatFile (file) {
  return {
    id: file.id,
    cache_id: file.cache_id,
    type: file.type,
    title: file.title,
    parent_folder: file.parent_folder,
    ancestor_folders: file.getAncestorFolders(),
    discarded: file.discarded,
    link: file.link,
    create_at: file.create_at,
    update_at: file.update_at,
    need_push_locally: file.need_push_locally,
    need_push_remotely: file.need_push_remotely,
    children: file.children,
    child_folders: file.child_folders,
    child_docs: file.child_docs
  }
}
