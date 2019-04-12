export default class File {
  constructor (opts) {
    console.log('File', opts)
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
    function getAncestor (file) {
      let parentFolder = file.store.map[file.parent_folder]
      if (parentFolder) {
        console.log('getAncestor', parentFolder, getAncestor(parentFolder))
        result.unshift(parentFolder.id)
        getAncestor(parentFolder)
      }
    }
    getAncestor(this)
    return result
  }

  update (data) {
    for (let name in data) {
      if (this.data.hasOwnProperty(name) && name !== 'id') {
        this.data[name] = data[name]
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

  get child_files () {
    return this.store.arr
      .filter(item => item.parent_folder === this.id)
  }

  get children () {
    return this.child_files
      .filter(item => item.type === 'folder')
  }

  get child_folders () {
    return this.children
      .map(item => item.id)
  }

  get child_docs () {
    return this.child_files
      .filter(item => item.type === 'doc')
      .map(item => item.id)
  }
}
