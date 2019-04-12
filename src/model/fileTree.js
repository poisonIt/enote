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
    console.log('init', data)
    data.forEach(item => {
      this.addFile(item)
    })

    this.updateFlatMap()
  }

  addFile (data) {
    console.log('addFile-1111', data)
    let newFile = new File({
      id: data._id,
      data: data,
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
}

function createFlatFile (file) {
  return {
    id: file.id,
    cache_id: file.cache_id,
    type: file.type,
    title: file.title,
    parent_folder: file.parent_folder,
    discarded: file.discarded,
    link: file.link,
    create_at: file.create_at,
    update_at: file.update_at,
    children: file.getChildFolders()
  }
}
