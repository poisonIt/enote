function fileModel (opts) {
  return {
    type: opts.type || 'folder',
    remote_id: opts.remote_id,
    title: opts.title || '新建文件夹',
    seq: opts.seq || 0,
    create_at: opts.create_at || new Date().valueOf(),
    update_at: opts.update_at || new Date().valueOf(),
    parent_folder: opts.parent_folder || '/',
    trash: opts.trash || 'NORMAL',
    need_push: opts.need_push !== undefined ? opts.need_push : true,
    content: opts.content || '',
    tags: opts.tags || [],
    top: opts.top || false,
  }
}

export default fileModel
