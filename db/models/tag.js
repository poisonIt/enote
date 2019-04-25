function TagModel (opts) {
  return {
    remote_id: opts.remote_id,
    name: opts.name || '未命名标签',
    trash: opts.trash || 'NORMAL'
  }
}

export default TagModel
