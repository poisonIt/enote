export default class File {
  constructor (opts) {
    // console.log('File', opts)
    this.need_push_locally = false
    this.need_push_remotely = opts.need_push_remotely === undefined
      ? opts.need_push_remotely : true

    for (let name in opts) {
      if (opts.hasOwnProperty(name)) {
        this[name] = opts[name]
      }
    }
  }

  getAncestorFolders () {
    let result = []
    if (this.data.depth === 0) {
      this.ancestorFolders = null
      return null
    }
    function getAncestor (file) {
      let parentFolder = file.store.map[file.parent_folder]
      console.log('getAncestorFolders', parentFolder)
      if (parentFolder) {
        result.unshift(parentFolder.id)
        getAncestor(parentFolder)
      } else {
        file.update({
          parent_folder: '/'
        })
      }
    }
    getAncestor(this)
    this.ancestorFolders = result
    // console.log('getAncestorFolders', this.type, this.title, result, this.ancestor_folders)
    return result
  }

  update (data) {
    console.log('update-111111', data, this.title, this.isExist)
    for (let name in data) {
      if (this.data.hasOwnProperty(name)) {
        this.data[name] = data[name]
      }
      if (this.hasOwnProperty(name)) {
        this[name] = data[name]
      }
    }
    if (!this.isExist) {
      this.need_push_locally = true
      this.need_push_remotely = true
    } else {
      this.isExist = false
    }
    console.log('update-222222', this.title, this.need_push_locally, this.need_push_remotely, this.isExist)
  }

  get id () {
    return this.data.remote_id || this.data._id
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

  set ancestorFolders (val) {
    // this.ancestor_folders = val
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

    // this.childDocs = val
    //   .filter(item => item.type === 'doc')

    // this.child_docs = this.childDocs.map(item => item.id)
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

  get file_size () {
    if (this.type === 'doc') {
      return this.content.length
    } else {
      return 0
      // let deepChildDocs = this.store.arr
      //   .filter(item => {
      //     // console.log('deep-ancestor_folders', item.ancestor_folders, this.id)
      //     return item.type === 'doc'
      //   })

      // console.log('deepChildDocs', deepChildDocs, this.ancestor_folders, this)

      // if (deepChildDocs.length === 0) {
      //   return 0
      // } else if (deepChildDocs.length === 1) {
      //   return deepChildDocs[0].file_size
      // } else {
      //   return deepChildDocs.reduce((a, b) => {
      //     return a.file_size + b.file_size
      //   })
      // }
    }
  }
}
