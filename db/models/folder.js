function folderModel (opts) {
  return {
    type: opts.type || 'folder',
    remote_id: opts.remote_id,
    pid: opts.pid || '0',
    remote_pid: opts.remote_pid,
    title: opts.title || '新建文件夹',
    seq: opts.seq || 0,
    create_at: opts.create_at || new Date().valueOf(),
    update_at: opts.update_at || new Date().valueOf(),
    trash: opts.trash || 'NORMAL',
    need_push: opts.need_push !== undefined ? opts.need_push : true
  }
}

export default folderModel
