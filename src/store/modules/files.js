// import { GenNonDuplicateID } from '@/utils/utils'
import { writeFile, readFile } from '@/utils/file'
import { remove } from 'lodash'
import dayjs from 'dayjs'

let filesArrTemp = []
let templateDocSize = ''
let templateDocContent = ''
const appPath = '/Users/bowiego/Documents/workspace/enote/public'
readFile(`${appPath}/template.xml`).then(data => {
  templateDocContent = formatContent(data.data)
  templateDocSize = data.size
})

const state = {
  files_map: {},
  files_arr: [],
  folders: {},
  recycle: [],
  current_folder_id: null,
  current_file_id: null
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

  UPDATE_DOC_BRIEF (state, obj) {
    let { id, brief, size } = obj
    state.files_map[id].brief = brief
    state.files_map[id].file_size = size
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
    obj.file_size = templateDocSize
    obj.brief = templateDocContent
    if (obj.type === 'folder') {
      obj.child_folders = []
      parentFolder.child_folders.push(obj.id)
    } else if (obj.type === 'doc') {
      if (!parentFolder.child_docs) {
        parentFolder.child_docs = []
      }
      parentFolder.child_docs.push(obj.id)
      // readFile(`${appPath}/docs/template.xml`).then(data => {
      //   writeFile(`${appPath}/docs/${obj.id}.xml`, data.data).then(() => {
      //     console.log('write xml success', obj)
      //     state.files_arr.push(obj)
      //   })
      // })
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
  },

  SET_CURRENT_FILE (state, id) {
    console.log('SET_CURRENT_FILE', id)
    state.current_file_id = id
  },

  SAVE_FILE_TITLE (state, obj) {
    const { id, title } = obj
    state.files_map[id].title = title
  }
}

const actions = {
  async SET_FILES_FROM_LOCAL ({ dispatch, commit }) {
    dispatch('SET_FILES', await fetchLocalFiles()).then(() => {
      dispatch('SET_DOC_BRIEF_FORM_LOCAL')
    })
  },

  SET_FILES ({ commit }, arr) {
    commit('SET_FILES', arr)
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
  },

  UPDATE_DOC_BRIEF ({ commit }, obj) {
    commit('UPDATE_DOC_BRIEF', obj)
    commit('UPDATE_FILE_ARR')
  },

  async SET_DOC_BRIEF_FORM_LOCAL ({ dispatch, commit }) {
    const filesContent = await fetchAllLocalDocContent()
    filesContent.forEach(content => {
      content.brief = formatContent(content.data)
      dispatch('UPDATE_DOC_BRIEF', content)
    })
  },

  async ADD_FILES ({ dispatch, commit }, obj) {
    if (obj.type === 'doc') {
      let id = await addDoc(obj.id)
      let content = await fetchLocalDocContent(id)
      content.brief = formatContent(content.data)
      commit('ADD_FILES', obj)
      commit('UPDATE_FILES_MAP')
      dispatch('UPDATE_DOC_BRIEF', content)
      commit('UPDATE_FOLDERS')
      commit('SAVE_FILES')
    } else {
      commit('ADD_FILES', obj)
      commit('UPDATE_FILES_MAP')
      commit('UPDATE_FOLDERS')
      commit('SAVE_FILES')
    }
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
  },

  SET_CURRENT_FILE ({ commit }, id) {
    commit('SET_CURRENT_FILE', id)
  },

  async SAVE_DOC ({ dispatch, commit }, obj) {
    console.log('SAVE_DOC', obj)
    const { id, html } = obj
    await writeFile(`${appPath}/docs/${id}.xml`, html)
    let content = await fetchLocalDocContent(id)
    content.brief = formatContent(content.data)
    dispatch('UPDATE_DOC_BRIEF', content)
  },

  SAVE_FILE_TITLE ({ commit }, obj ) {
    commit('SAVE_FILE_TITLE', obj)
    commit('UPDATE_FILE_ARR')
    commit('UPDATE_FOLDERS')
    commit('SAVE_FILES')
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
    let rootIdx = result.indexOf(state.files_map['000000'])
    result.splice(rootIdx, 1)
    return result
  },

  GET_FOLEDERS (state) {
    return state.folders
  },

  GET_RECYCLE (state) {
    return state.recycle
  },

  GET_CURRENT_FILES (state) {
    if (!state.current_folder_id) {
      return []
    }
    const currentFolder = state.files_map[state.current_folder_id]
    const childFolders = currentFolder.child_folders || []
    const childDocs = currentFolder.child_docs || []
    return [...childFolders, ...childDocs].map(id => state.files_map[id])
  },

  GET_CURRENT_FILE (state) {
    return state.files_map[state.current_file_id]
  }
}

function fetchLocalFiles () {
  return new Promise((resolve, reject) => {
    fetch('../../mock/files.json').then(resp => {
      return resp.json()
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
    readFile(`${appPath}/docs/${id}.xml`).then(data => {
      data.id = id
      resolve(data)
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
    readFile(`${appPath}/template.xml`).then(data => {
      writeFile(`${appPath}/docs/${id}.xml`, data.data).then(() => {
        console.log('write xml success', id)
        resolve(id)
      })
    })
  })
}

function formatContent (str) {
  // let start = str.indexOf('>')
  // let end = str.indexOf('</')
  return str.replace(/<[^>].*?>/g, ' ').replace('&nbsp;', ' ')
}

export default {
  state,
  mutations,
  actions,
  getters
}
