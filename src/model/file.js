export default class File {
  constructor (opts) {
    // console.log('File', opts)
    this.need_push_locally = false
    this.need_push_remotely = opts.need_push_remotely || true

    for (let name in opts) {
      if (opts.hasOwnProperty(name)) {
        this[name] = opts[name]
      }
    }
  }

  getAncestorFolders () {
    let result = []
    if (this.data.depth === 0) {
      this.ancestor_folders = null
      return null
    }
    function getAncestor (file) {
      let parentFolder = file.store.map[file.parent_folder]
      if (parentFolder) {
        result.unshift(parentFolder.id)
        getAncestor(parentFolder)
      }
    }
    getAncestor(this)
    this.ancestor_folders = result
    return result
  }

  update (data) {
    console.log('update-101010101', data)
    for (let name in data) {
      if (this.data.hasOwnProperty(name)) {
        this.data[name] = data[name]
      }
      if (this.hasOwnProperty(name)) {
        this[name] = data[name]
      }
    }
    this.need_push_locally = true
    this.need_push_remotely = true
  }

  toggleShouldUpdate (val) {
    this.shouldUpdateLocal = val
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
  
  get discarded () {
    return this.data.discarded
  }

  set discarded (val) {
    this.child_files.forEach(item => {
      item.discarded = val
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

  set ancestor_folders (val) {
    if (val) {
      this.child_files = this.store.arr
        .filter(item => item.parent_folder === this.id)
    } else {
      this.child_files = this.store.arr
        .filter(item => item.parent_folder === '/')
    }
  }

  get child_files () {
    return this._child_files
  }

  set child_files (val) {
    this._child_files = val
    this.children = val
      .filter(item => item.type === 'folder')
      .sort((a, b) => {
        return a.seq - b.seq
      })
  
    this.child_folders = this.children.map(item => item.id)

    this.child_docs = val
      .filter(item => item.type === 'doc')
      .map(item => item.id)
  }

  get child_folders () {
    return this._child_folders
  }

  set child_folders (val) {
    this._child_folders = val
    this._child_folders.forEach(id => {
      this.store.map[id].update({
        seq: val.indexOf(id)
      })
    })
  }

  get parentFolder () {
    return this.parent_folder !== '/'
      ? this.store.map[this.parent_folder]
      : null
  }
}
