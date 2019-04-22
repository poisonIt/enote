export default class File {
  constructor (opts) {
    // console.log('File', opts)
    this.need_push_locally = false
    this.need_push_remotely = opts.need_push_remotely === undefined
      ? opts.need_push_remotely : true

    this.ancestor_folders = []
    this.parentFolder = null

    for (let name in opts) {
      if (opts.hasOwnProperty(name)) {
        this[name] = opts[name]
      }
    }

    if (opts.depth === undefined && this.type === 'folder') {
      let parentFolder = this.store.map[this.parent_folder] || this.store.root
      this.depth = parentFolder.depth + 1
      if (opts.data.cache_id) {
        this.seq = parentFolder.child_folders.length
      }
    }

  }

  getAncestorFolders () {
    if (this.depth !== 0) { 
      let parentFolder = this.store.map[this.parent_folder]
      if (!parentFolder && this.parent_folder !== '/') {
        this.update({
          parent_folder: '/'
        }, true)
        parentFolder = this.store.root
      }
  
      parentFolder = !parentFolder ? this.store.root : parentFolder
      if (this.type === 'folder') {
        this.depth = parentFolder.depth + 1
      }
      this.parentFolder = parentFolder
      this.ancestor_folders = [...parentFolder.ancestor_folders, parentFolder]
    }

    let l = this.depth === 0 ? '/' : this.id

    if (this.type === 'folder') {
      this.child_files = this.store.arr.filter(item => item.parent_folder === l)
      this.child_folders = this.child_files
        .filter(item => item.type === 'folder')
        .sort((a, b) => a.seq - b.seq)

      this._child_folders = this.child_folders.map(item => item.id)
      this.child_files.forEach(child => {
        if (child.type === 'folder') {
          let idx = this._child_folders.indexOf(child.id)
          if (child.seq !== idx) {
            child.update({
              seq: idx
            })
          }
        }
        child.getAncestorFolders()
      })
    }
  }

  update (data, forceUpdate) {
    if (data.parent_folder && this.parent_folder !== data.parent_folder) {
      let newParentFolder = this.store.map[data.parent_folder] || this.store.root
      if (this.depth !== newParentFolder.depth + 1) {
        this.depth = newParentFolder.depth + 1
        updateChildDepth(this, newParentFolder.depth + 1 - this.depth)
      }
    }

    for (let name in data) {
      if (this.data.hasOwnProperty(name)) {
        this.data[name] = data[name]
      }
      if (this.hasOwnProperty(name)) {
        this[name] = data[name]
      }
    }

    if (this.depth === 0) return
    this.need_push_locally = true
    this.need_push_remotely = true
    // console.log('update-222222', this.title, this.need_push_locally, this.need_push_remotely, this.isExist)
    // if (this.need_push_remotely) {
    //   console.log('need_push_remotely', this.title)
    // }
  }

  get id () {
    return this.data._id
  }

  set id (val) {
    // console.log('setter: ' + val)
  }

  get cache_id () {
    return this.data.cache_id || null
  }
  
  get type () {
    return this.data.type
  }

  get title () {
    return this.data.title
  }

  get parent_folder () {
    return this.data.parent_folder
  }
  
  get trash () {
    return this.data.trash
  }

  set trash (val) {
    this.child_files.forEach(item => {
      item.trash = val
    })
  }

  get link () {
    return this.data.type === 'folder' ? 'new folder' : 'doc'
  }

  get create_at () {
    return this.data.create_at
  }

  get update_at () {
    return this.data.create_at
  }

  get content () {
    return this.data.content
  }

  get file_size () {
    if (this.type === 'doc') {
      return this.content.length
    } else {
      return 0
    }
  }

  get top () {
    return this.data.top
  }
}

function updateChildDepth (file, change) {
  file.child_folders.forEach(item => {
    let child = file.store.map[item]
    child.depth += change
    child.parentFolder = file
    child.ancestor_folders = [...file.ancestor_folders, file]
    updateChildDepth(child, change)
  })
}
