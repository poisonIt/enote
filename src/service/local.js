import LocalDAO from '../../db/api'

// user
export function getLocalUserById (params) {
  return LocalDAO.user.getById(params)
}

export function updateLocalUser (params) {
  return LocalDAO.user.update(params)
}

// folder
export function getAllLocalFolder () {
  return LocalDAO.folder.getAll()
}

export function getLocalFolderByPid (params) {
  return LocalDAO.folder.getByPid(params)
}

export function getLocalTrashFolder () {
  return LocalDAO.folder.getTrash()
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

export function getLocalTrashNote () {
  return LocalDAO.note.getTrash()
}

export function addLocalNote (params) {
  return LocalDAO.note.add(params)
}

export function updateLocalNote (params) {
  return LocalDAO.note.update(params)
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
