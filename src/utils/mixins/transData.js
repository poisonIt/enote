export function transNoteBookDataFromRemote (obj) {
  let pid = obj.parentId
  return {
    type: 'folder',
    remote_id: obj.noteBookId,
    // pid: pid,f
    remote_pid: pid,
    title: obj.title || '',
    seq: obj.seq || 0,
    create_at: new Date(obj.createDt).valueOf(),
    update_at: new Date(obj.modifyDt).valueOf(),
    trash: obj.trash,
    need_push: false
  }
}

export function transNoteDataFromRemote (obj, allTagLocalMap) {
  return {
    type: 'note',
    remote_id: obj.noteId,
    title: obj.title || '',
    create_at: new Date(obj.createDt).valueOf(),
    update_at: new Date(obj.modifyDt).valueOf(),
    // pid: obj.noteBookId,
    remote_pid: obj.noteBookId,
    trash: obj.trash,
    size: obj.size,
    content: obj.noteContent,
    // tags: obj.tagId ? obj.tagId.map(item => allTagLocalMap[item]) : [],
    need_push: false,
    top: obj.top,
    share: obj.share,
    usn: obj.usn,
    username: obj.username,
    publicNoteId: obj.publicNoteId || [],
    noteFiles: obj.noteFiles
  }
}


export function transTagDataFromRemote (obj) {
  return {
    name: obj.tagName,
    remote_id: obj.tagId,
    need_push: false
  }
}


export function transAttachMentList (obj) {
  let ret = []
  obj.forEach(item => {
    ret.push({
      attachmentId: item.externalId,
      status: item.status
    })
  })
  return ret
}
