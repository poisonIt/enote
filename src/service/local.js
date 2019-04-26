import LocalDAO from '../../db/api'

// folder

export function getAllLocalFolder () {
  return LocalDAO.folder.getAll()
}

export function addLocalFolder (params) {
  return LocalDAO.folder.add(params)
}

export function updateLocalFolder (params) {
  return LocalDAO.folder.update(params)
}

// note

export function getAllLocalNote () {
  return LocalDAO.note.getAll()
}

export function getLocalNoteByPid (params) {
  return LocalDAO.note.getByPid(params)
}

export function addLocalNote (params) {
  return LocalDAO.note.add(params)
}

// doc

export function getAllLocalDoc () {
  return LocalDAO.doc.getAll()
}

export function getLocalDoc (params) {
  return LocalDAO.doc.getByNoteId(params)
}

export function updateLocalDoc (params) {
  console.log('updateLocalDoc', params)
  return LocalDAO.doc.update(params)
}
