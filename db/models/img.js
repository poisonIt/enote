function imgModel (opts) {
  return {
    name: opts.name || '',
    path: opts.path || '',
    doc_id: opts.doc_id || '',
    ext: opts.ext || '',
    mime: opts.mime || ''
  }
}

export default imgModel
