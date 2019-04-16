function fileModel (opts) {
  return {
    type: opts.type || 'folder',
    remote_id: opts.remote_id,
    title: opts.title || '新建文件夹',
    seq: opts.seq || 0,
    create_at: opts.create_at || new Date().valueOf(),
    update_at: opts.update_at || new Date().valueOf(),
    // file_size: opts.file_size || 0,
    // file_path: opts.file_path ||  ['/'],
    parent_folder: opts.parent_folder || '/',
    trash: opts.trash || 'NORMAL',
    need_push: opts.need_push !== undefined ? opts.need_push : true,
    content: opts.content || ''
    // ancestor_folders: opts.ancestor_folders || [],
    // child_folders: opts.child_folders || [],
    // child_docs: opts.child_docs || []
  }
}

export default fileModel
