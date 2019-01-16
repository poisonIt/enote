import { GenNonDuplicateID } from '@/utils/utils'
import { writeFile, readFile } from '@/utils/file'
import { remove } from 'lodash'
import dayjs from 'dayjs'

const appPath = '/Users/bowiego/Documents/workspace/enote/public'

const state = {
  files_map: {},
  files_arr: [],
  folders: {},
  recycle: [],
  current_folder_id: null
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

  ADD_FILES (state, obj) {
    if (state.files_map[obj.id]) {
      return
    }
    let parentFolder = state.files_map[obj.parent_folder]
    // obj.id = GenNonDuplicateID(6)
    let timeStamp = String(dayjs(new Date()).valueOf())
    obj.create_at = timeStamp
    obj.update_at = timeStamp
    obj.ancestor_folders = [...parentFolder.ancestor_folders, parentFolder.id]
    obj.file_size = 0
    if (obj.type === 'folder') {
      obj.child_folders = []
      parentFolder.child_folders.push(obj.id)
    } else if (obj.type === 'doc') {
      if (!parentFolder.child_docs) {
        parentFolder.child_docs = []
      }
      parentFolder.child_docs.push(obj.id)
      readFile(`${appPath}/docs/template.xml`).then(data => {
        writeFile(`${appPath}/docs/${obj.id}.xml`, data.data).then(() => {
          console.log('write xml success', obj)
        })
      })
    }
    state.files_arr.push(obj)
    // console.log(state)
  },

  DELETE_FILE (state, id) {
    let file = state.files_map[id]
    let parentFile = state.files_map[file.parent_folder]
    remove(parentFile.child_folders, item => item === id)
    remove(state.files_arr, item => item.id === id)
    file.child_folders.forEach(childId => {
      remove(state.files_arr, item => item.id === childId)
    })
  },

  EDIT_FILE (state, opts) {
    let { id, attr, val } = opts
    state.files_map[id][attr] = val
  },

  UPDATE_FILE_ARR (state) {
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
    writeFile(`${appPath}/mock/files.json`, JSON.stringify(state.files_map))
  },

  SET_CURRENT_FOLDER (state, id) {
    state.current_folder_id = id
  }
}

const actions = {
  SET_FILES ({ commit }, arr) {
    commit('SET_FILES', arr)
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  ADD_FILES ({ commit }, obj) {
    commit('ADD_FILES', obj)
    commit('UPDATE_FILES_MAP')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  DELETE_FILE ({ commit }, id) {
    commit('DELETE_FILE', id)
    commit('UPDATE_FILES_MAP')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  EDIT_FILE ({ commit }, opts) {
    commit('EDIT_FILE', opts)
    commit('UPDATE_FILE_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  SET_CURRENT_FOLDER ({ commit }, id) {
    commit('SET_CURRENT_FOLDER', id)
  }
}

const getters = {
  GET_FILES (state) {
    return state.files_map
  },

  GET_FILES_ARRAY () {
    return state.files_arr
  },

  GET_LATEST_FILES (state) {
    let result = [...state.files_arr]
    if (result.length > 0) {
      return result
        .filter(file => file.type !== 'folder')
        .sort((a, b) => {
          return (new Date(b.update_at)).getTime() - (new Date(b.update_at)).getTime()
        })
    } else {
      return []
    }
  },

  GET_FOLEDERS (state) {
    console.log('GET_FOLEDERS', state)
    return state.folders
  },

  GET_RECYCLE (state) {
    return state.recycle
  },

  GET_CURRENT_FILES (state) {
    console.log(state)
    if (!state.current_folder_id) {
      return []
    }
    const currentFolder = state.files_map[state.current_folder_id]
    console.log('currentFolder', currentFolder)
    const childFolders = currentFolder.child_folders || []
    const childDocs = currentFolder.child_docs || []
    return [...childFolders, ...childDocs].map(id => state.files_map[id])
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
