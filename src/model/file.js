export default class File {
  constructor (opts) {
    console.log('File', opts)
    this.children = []
    this.shouldUpdateLocal = false

    for (let name in opts) {
      if (opts.hasOwnProperty(name)) {
        this[name] = opts[name]
      }
    }
  }

  getChildFolders () {
    return this.store.arr.filter(item =>
      item.type === 'folder' &&
      item.parent_folder === this.id)
  }

  update (data) {
    for (let name in data) {
      if (this.data.hasOwnProperty(name) && name !== 'id') {
        this.data[name] = data[name]
      }
    }
  }

  toggleShouldUpdate (val) {
    this.shouldUpdateLocal = val
  }

  get id () {
    return this.data._id
  }

  get cache_id () {
    return this.data.cache_id || null
  }
  
  set id (val) {
    // console.log('setter: ' + val)
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

  get link () {
    return this.data.type === 'folder' ? 'new folder' : 'doc'
  }

  get create_at () {
    return this.data.create_at
  }

  get update_at () {
    return this.data.create_at
  }
}
