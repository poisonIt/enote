function docModel (opts) {
  return {
    type: 'doc',
    title: opts.title || '无标题笔记',
    doc_id: opts.doc_id,
    create_at: new Date(),
    update_at: new Date(),
    file_size: opts.file_size || 0,
    file_path: ['/'],
    parent_folder: opts.parent_folder,
    ancestor_folders: opts.ancestor_folders || []
  }
}

export default docModel
