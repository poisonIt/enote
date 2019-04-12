function fileModel (opts) {
  return {
    type: opts.type || 'folder',
    title: opts.title || '新建文件夹',
    create_at: opts.create_at || new Date().valueOf(),
    update_at: opts.update_at || new Date().valueOf(),
    // file_size: opts.file_size || 0,
    file_path: opts.file_path ||  ['/'],
    parent_folder: opts.parent_folder,
    discarded: opts.discarded || false
    // ancestor_folders: opts.ancestor_folders || [],
    // child_folders: opts.child_folders || [],
    // child_docs: opts.child_docs || []
  }
}

export default fileModel
