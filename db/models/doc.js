function docModel (opts) {
  return {
    type: 'doc',
    remote_id: opts.remote_id,
    note_id: opts.note_id,
    remote_note_id: opts.remote_note_id,
    content: opts.content || '',
    create_at: new Date(),
    update_at: new Date(),
    need_push: opts.need_push !== undefined ? opts.need_push : true
  }
}

export default docModel
