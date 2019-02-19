import { remove } from 'lodash'
import dayjs from 'dayjs'
import LocalDAO from '../../../db/api'
import docTemplate from '../../../db/docTemplate'

const docBriefTemplate = formatContent(docTemplate)
let filesArrTemp = []

const state = {
  files_map: {},
  files_arr: [],
  doc_map: {},
  folders: {},
  current_folder_id: null,
  current_file_id: null,
  search_keyword: ''
}

const mutations = {
  SET_FILES (state, obj) {
    let map = {}
    let arr = []
    for (let i in obj) {
      map[i] = obj[i]
      arr.push(obj[i])
    }
    state.files_map = map
    state.files_arr = arr
  },

  UPDATE_FILE_BRIEF (state, obj) {
    let { id, brief } = obj
    let file = state.files_map[id]
    if (brief) {
      file.brief = brief.slice(0, 20)
    }
    file.file_size = brief.length
  },

  ADD_FILE (state, obj) {
    if (state.files_map[obj.id]) {
      return
    }
    let parentFolder = state.files_map[obj.parent_folder]
    let timeStamp = String(dayjs(new Date()).valueOf())
    obj.create_at = timeStamp
    obj.update_at = timeStamp
    obj.ancestor_folders = [...parentFolder.ancestor_folders, parentFolder.id]
    obj.file_size = 0
    if (obj.type === 'folder') {
      obj.child_folders = []
      parentFolder.child_folders.push(obj.id)
    } else if (obj.type === 'doc') {
      obj.file_size = docBriefTemplate.length
      obj.brief = docBriefTemplate
      obj.ancestor_folders.forEach(id => {
        state.files_map[id].file_size = state.files_map[id].file_size + obj.file_size
      })
      if (!parentFolder.child_docs) {
        parentFolder.child_docs = []
      }
      parentFolder.child_docs.push(obj.id)
    }
    state.files_arr.push(obj)
  },

  DELETE_FILE (state, id) {
    let file = state.files_map[id]
    file.discarded = true
  },

  EDIT_FILE (state, opts) {
    let { id, attr, val } = opts
    state.files_map[id][attr] = val
  },

  MOVE_FILE (state, opts) {
    let { fileId, targetId } = opts
    let file = state.files_map[fileId]
    let targetFolder = state.files_map[targetId]
    let oldParentFolder = state.files_map[file.parent_folder]
    file.parent_folder = targetFolder.id
    file.ancestor_folders = [...targetFolder.ancestor_folders, targetFolder.id]
    if (file.type === 'folder') {
      remove(oldParentFolder.child_folders, item => item === file.id)
      // update child
      updateChildAncestorFolders(file, state)

      if (!targetFolder.child_folders) {
        targetFolder.child_folders = []
      }
      targetFolder.child_folders.push(file.id)
    } else if (file.type === 'doc') {
      remove(oldParentFolder.child_docs, item => item === file.id)

      if (!targetFolder.child_docs) {
        targetFolder.child_docs = []
      }
      targetFolder.child_docs.push(file.id)
    }
  },

  CLEAR_ALL_RECYCLE (state) {
    let recycledFiles = state.files_arr.filter(file => file.discarded)
    recycledFiles.forEach(file => {
      // handle parentFolder
      let parentFolder = state.files_map[file.parent_folder]
      if (parentFolder) {
        if (file.type === 'doc') {
          remove(parentFolder.child_docs, item => item === file.id)
        } else if (file.type === 'folder') {
          remove(parentFolder.child_folders, item => item === file.id)
        }
      }

      // handle childFile
      if (file.type === 'folder') {
        let allChildFile = state.files_arr.filter(fileTemp => {
          return fileTemp.ancestor_folders.indexOf(file.id) > -1
        })

        allChildFile.forEach(childFile => {
          remove(state.files_arr, item => item.id === childFile.id)
          if (childFile.type === 'doc') {
            LocalDAO.doc.remove({
              fileId: childFile.id
            })
          }
        })
      }

      // handle file
      if (file.type === 'doc') {
        LocalDAO.doc.remove({
          fileId: file.id
        })
      }

      remove(state.files_arr, item => item.id === file.id)
    })
  },

  RESUME_ALL_RECYCLE (state) {
    state.files_arr.forEach(file => {
      file.discarded = false
    })
  },

  UPDATE_FILES_ARR (state) {
    state.files_arr = []
    for (let i in state.files_map) {
      state.files_arr.push(state.files_map[i])
    }
  },

  UPDATE_FILES_MAP (state) {
    let newFiles = {}
    state.files_arr.forEach(file => {
      newFiles[file.id] = file
    })
    state.files_map = newFiles
  },

  UPDATE_DOC_MAP (state, arr) {
    state.doc_map = {}
    arr.forEach(item => {
      state.doc_map[item.id] = item
    })
  },

  UPDATE_FOLDERS (state) {
    let newFolders = {}
    state.files_arr.forEach(file => {
      if (file.type === 'folder') {
        newFolders[file.id] = file
      }
    })
    state.folders = newFolders
  },

  SAVE_FILES (state) {
    LocalDAO.files.saveAll(JSON.stringify(state.files_map))
  },

  SET_CURRENT_FOLDER (state, id) {
    state.current_folder_id = id
  },

  SET_CURRENT_FILE (state, id) {
    state.current_file_id = id
  },

  SAVE_FILE_TITLE (state, obj) {
    const { id, title } = obj
    state.files_map[id].title = title
  },

  SET_SEARCH_KEYWORD (state, str) {
    state.search_keyword = str
  }
}

const actions = {
  async SET_FILES_FROM_LOCAL ({ dispatch, commit }) {
    dispatch('SET_FILES', await fetchLocalFiles()).then(() => {
      dispatch('SET_DOC_BRIEF_FORM_LOCAL')
    })
  },

  SET_FILES ({ commit }, arr) {
    // delete surplus docs
    commit('SET_FILES', arr)
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  UPDATE_FILE_BRIEF ({ commit }, obj) {
    commit('UPDATE_FILE_BRIEF', obj)
    commit('UPDATE_FILES_ARR')
  },

  async SET_DOC_BRIEF_FORM_LOCAL ({ dispatch, commit }) {
    const filesContent = await fetchAllLocalDocContent()
    console.log('filesContent', filesContent)
    commit('UPDATE_DOC_MAP', filesContent)
    filesContent.forEach(content => {
      content.brief = formatContent(content.data)
      dispatch('UPDATE_FILE_BRIEF', content)
    })
  },

  async ADD_FILE ({ dispatch, commit }, obj) {
    if (obj.type === 'doc') {
      let id = await addDoc(obj.id)
      let content = await fetchLocalDocContent(id)
      content.brief = formatContent(content.data)
      commit('ADD_FILE', obj)
      commit('UPDATE_FILES_MAP')
      dispatch('UPDATE_FILE_BRIEF', content)
      commit('UPDATE_FOLDERS')
      commit('SAVE_FILES')
    } else {
      commit('ADD_FILE', obj)
      commit('UPDATE_FILES_MAP')
      commit('UPDATE_FOLDERS')
      commit('SAVE_FILES')
    }
  },

  DELETE_FILE ({ commit }, id) {
    commit('DELETE_FILE', id)
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  EDIT_FILE ({ commit }, opts) {
    commit('EDIT_FILE', opts)
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  MOVE_FILE ({ commit }, opts) {
    commit('MOVE_FILE', opts)
    commit('UPDATE_FILES_MAP')
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  CLEAR_ALL_RECYCLE ({ commit }) {
    commit('CLEAR_ALL_RECYCLE')
    commit('UPDATE_FILES_MAP')
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  RESUME_ALL_RECYCLE ({ commit }) {
    commit('RESUME_ALL_RECYCLE')
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  SET_CURRENT_FOLDER ({ commit }, id) {
    commit('SET_CURRENT_FOLDER', id)
  },

  SET_CURRENT_FILE ({ commit }, id) {
    commit('SET_CURRENT_FILE', id)
  },

  async SAVE_DOC ({ dispatch, commit }, obj) {
    console.log('SAVE_DOC')
    const { id, html } = obj
    // await writeFile(`${appPath}/docs/${id}.xml`, html)
    LocalDAO.doc.update({
      fileId: id,
      content: html
    })
    let content = await fetchLocalDocContent(id)
    content.brief = formatContent(content.data)
    dispatch('UPDATE_FILE_BRIEF', content)
  },

  SAVE_FILE_TITLE ({ commit }, obj) {
    commit('SAVE_FILE_TITLE', obj)
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  SET_SEARCH_KEYWORD ({ commit }, str) {
    commit('SET_SEARCH_KEYWORD', str)
  }
}

const getters = {
  GET_FILES (state) {
    return state.files_map
  },

  GET_FILES_ARRAY (state) {
    return state.files_arr
  },

  GET_LATEST_FILES (state) {
    let result = state.files_arr.filter(file => !file.discarded)
    let rootIdx = result.indexOf(state.files_map['000000'])
    result.splice(rootIdx, 1)
    return result
  },

  GET_FOLEDERS (state) {
    return state.folders
  },

  GET_RECYCLE_FILES (state) {
    return state.files_arr.filter(file => file.discarded)
  },

  GET_CURRENT_FOLDER (state) {
    if (!state.current_folder_id) {
      return []
    }
    const currentFolder = state.files_map[state.current_folder_id]
    return currentFolder
  },

  GET_CURRENT_FILES (state) {
    if (!state.current_folder_id) {
      return []
    }
    const currentFolder = state.files_map[state.current_folder_id]
    const childFolders = currentFolder.child_folders || []
    const childDocs = currentFolder.child_docs || []

    return [...childFolders, ...childDocs]
      .map(id => state.files_map[id])
      .filter(file => {
        if (file.discarded) {
          return false
        }
        if (state.search_keyword !== '') {
          if (file.title.indexOf(state.search_keyword) > -1) {
            return true
          }
          if (file.id &&
            state.doc_map[file.id] &&
            state.doc_map[file.id].data.indexOf(state.search_keyword) > -1) {
            return true
          }
        } else {
          return true
        }
      })
  },

  GET_CURRENT_FILE (state) {
    return state.files_map[state.current_file_id]
  },

  GET_SEARCH_KEYWORD (state) {
    return state.search_keyword
  }
}

function fetchLocalFiles () {
  return new Promise((resolve, reject) => {
    LocalDAO.files.getAll().then(resp => {
      return JSON.parse(resp)
    }).then(data => {
      if (!data['000000']) {
        let timeStamp = String(dayjs(new Date()).valueOf())
        let id = '000000'
        data[id] = {
          id: id,
          type: 'folder',
          title: '我的文件夹',
          content: '',
          create_at: timeStamp,
          update_at: timeStamp,
          file_size: '0',
          file_path: ['/'],
          ancestor_folders: [],
          child_folders: []
        }
      }
      for (let i in data) {
        filesArrTemp.push(data[i])
      }
      resolve(data)
    })
  })
}

function fetchLocalDocContent (id) {
  return new Promise((resolve, reject) => {
    LocalDAO.doc.get(id).then(res => {
      resolve({
        id: id,
        data: res
      })
    })
  })
}

function fetchAllLocalDocContent () {
  let asyncRead = filesArrTemp
    .filter(file => file.type === 'doc')
    .map(doc => {
      return fetchLocalDocContent(doc.id)
    })

  return Promise.all(asyncRead)
}

function addDoc (id) {
  return new Promise((resolve, reject) => {
    LocalDAO.doc.add({
      fileId: id,
      content: docTemplate
    }).then(res => {
      resolve(id)
    })
  })
}

function updateChildAncestorFolders (file, state) {
  let childFiles = state.files_arr.filter(item => {
    if (item.parent_folder) {
      return item.parent_folder === file.id
    }
  })

  childFiles.forEach(child => {
    child.ancestor_folders = [...file.ancestor_folders, file.id]
    if (child.type === 'folder') {
      updateChildAncestorFolders(child, state)
    }
  })
}

function formatContent (str) {
  return str.replace(/<[^>].*?>/g, ' ')
    .replace('&nbsp;', ' ')
    .replace('&amp;', '&')
    .replace('&lt;', '<')
    .replace('&gt;', '>')
}

export default {
  state,
  mutations,
  actions,
  getters
}
