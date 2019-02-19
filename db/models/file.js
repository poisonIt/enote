function fileModel (opts) {
  return {
    type: 'folder',
    title: opts.title || '新建文件夹',
    create_at: new Date(),
    update_at: new Date(),
    file_size: 0,
    file_path: ['/'],
    parent_folder: opts.parent_folder,
    ancestor_folders: opts.ancestor_folders || [],
    child_folders: [],
    child_docs: []
  }
}

export default fileModel
