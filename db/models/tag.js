function TagModel (opts) {
  return {
    type: opts.type || 'tag',
    remote_id: opts.remote_id,
    name: opts.name || '未命名标签',
    trash: opts.trash || 'NORMAL',
    need_push: opts.need_push !== undefined ? opts.need_push : true
  }
}

export default TagModel
