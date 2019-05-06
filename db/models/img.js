function imgModel (opts) {
  return {
    name: opts.name || '',
    path: opts.path || '',
    note_id: opts.note_id || '',
    ext: opts.ext || '',
    mime: opts.mime || ''
  }
}

export default imgModel
