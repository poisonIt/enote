import { remove, clone, cloneDeep } from 'lodash'
import dayjs from 'dayjs'
import LocalDAO from '../../../db/api'
import docTemplate from '../../../db/docTemplate'
import { GenNonDuplicateID } from '@/utils/utils'
import File from '../../model/file'
import FileTree from '../../model/fileTree'

const docBriefTemplate = formatContent(docTemplate)
let filesArrTemp = []
let fileTree = new FileTree()
let folderKeys = ['id', 'remote_id', 'cache_id', 'type', 'seq', 'depth', 'title', 'trash', 'link', '_child_folders', 'content']


const state = {
  files_map: fileTree.map,
  files_arr: [],
  push_files_locally: [],
  doc_map: {},
  tags_map: {},
  tags_arr: [],
  folders: {},
  stick_top_files: [],
  current_folder_id: null,
  current_file_id: null,
  share_info: null,
  search_keyword: ''
}

const mutations = {
  UPDATE_FILE_BRIEF (state, obj) {
    let { id, brief } = obj
    let file = state.files_map[id]
    if (brief) {
      file.brief = brief.slice(0, 20)
    }
    file.file_size = brief.length
  },

  UPDATE_FILE_UPDATE_AT (state, id) {
    let file = state.files_map[id]
    file.update_at = String(dayjs(new Date()).valueOf())
  },

  UPDATE_FILE (state, opts) {
    fileTree.updateFile(opts)
  },

  // DELETE_FILE (state, id) {
  //   let file = state.files_map[id]
  //   file.trash = 'TRASH'
  //   file._child_folders.forEach(item => {
  //     fileTree.updateFile({
  //       id: item.id,
  //       trash: 'TRASH'
  //     })
  //   })
  // },

  EDIT_DOC (state, opts) {
    let { id, content } = opts

    let docFile = state.files_map[id]
    if (docFile && docFile.type === 'doc') {
      fileTree.updateFile(opts)
      docFile.content = content
      docFile.need_push_remotely = true
    }
  },

  APPEND_FILE (state, opts) {
    let { fileId, targetId } = opts
    console.log('APPEND_FILE', opts)

    fileTree.appendFile({
      id: fileId,
      targetId: targetId
    }).updateFlatMap(true)
  },

  MOVE_FILE (state, opts) {
    let { fileId, broId, type } = opts // type: 'before', 'after'
    console.log('MOVE_FILE', opts)

    fileTree.moveFile({
      id: fileId,
      broId: broId,
      type: type
    }).updateFlatMap(true)

    console.log('MOVE_FILE-map', fileTree.map)
  },

  SET_TAGS (state, tags) {
    let map = {}
    state.tags_map = {}
    state.tags_arr = []
    tags.forEach(item => {
      if (!item.note_ids) {
        item.note_ids = []
      }
      if (item._id === '1ZM2YfYYigN7h740') {
        item.note_ids = ['0beCoLNsVzcO3a6P']
      }
      console.log('item', item)
      map[item._id] = item
    })
    for (let i in state.files_map) {
      let file = state.files_map[i]
      file.tags.forEach(tagId => {
        let tag = map[tagId]
        tags.note_ids.push(tagId)
      })
    }
    state.tags_map = map
    console.log('tags_map', state.tags_map)
    state.tags_arr = Object.keys(state.tags_map)
      .map(key => state.tags_map[key])
  },

  ADD_FILE_TAG (state, opts) {
    let { fileId, tagId } = opts
    let file = state.files_map[fileId]
    if (!file.tags) file.tags = []
    file.tags.push(tagId)
  },

  REMOVE_FILE_TAG (state, opts) {
    let { fileId, tagId } = opts
    let file = state.files_map[fileId]
    remove(file.tags, tagId)
  },

  CLEAR_ALL_RECYCLE (state) {
    state.files_arr
      .filter(item => item.trash === 'TRASH')
      .forEach(item => {
        deleteFile(item.id)
      })
  },

  RESUME_ALL_RECYCLE (state) {
    state.files_arr
      .filter(item => item.trash === 'TRASH')
      .forEach(item => {
        // item.trash = 'NORMAL'
        // item.need_push_locally = true
        // item.need_push_remotely = true
        fileTree.updateFile({
          id: item.id,
          trash: 'NORMAL'
        })
      })
  },

  REFRESH_FILES (state) {
    state.files_map = cloneDeep(fileTree.flat_map)
    let arr = []
    let folders = {}
    state.files_arr = []
    state.folders = {}

    for (let i in state.files_map) {
      let file = state.files_map[i]
      arr.push(file)
      if (file.type === 'folder' && file.parent_folder === '/') {
        let folderTmp = folders[file.id]
        if (folderTmp) {
          folderKeys.forEach(name => {
            if (folderTmp[name] !== file[name]) {
              console.log('rerere', name, folderTmp[name], file[name])
              folderTmp[name] = file[name]
            }
          })
        } else {
          folders[file.id] = createFolderData(file)
        }
      }
    }
    state.files_arr = arr
    state.folders = folders
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

  // SAVE_FILES (state) {
  //   console.log('SAVE_FILES-1111', state)
  //   state.files_arr
  //     .filter(item => item.need_push_locally)
  //     .forEach(file => {
  //       console.log('SAVE_FILES-2222', file.id)
  //       if (file.id !== '000000') {
  //         LocalDAO.files.update({
  //           id: file.id,
  //           data: file
  //         }).then(resp => {
  //           console.log('UPDATE_resp', resp)
  //           // file.need_push_locally = false
  //           state.files_map[file.id].need_push_locally = false
  //           fileTree.finishPushLocally(file.id)
  //           console.log('UPDATE_resp-222', state)
  //         })
  //       }
  //     })
  // },

  FILES_SAVED (state, arr) {
    arr.forEach(item => {
      state.files_map[item.id].need_push_locally = false
    })
  },

  SET_FILE_PUSH_FINISHED (state, obj) {
    let { id, remote_id } = obj
    let stateFile = state.files_map[id]
    stateFile.remote_id = remote_id
    stateFile.need_push_remotely = false
    let sourceFile = fileTree.map[id]
    sourceFile.remote_id = remote_id
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
  },

  STICK_TOP_FILE (state, id) {
    if (state.stick_top_files.indexOf(id) === -1) {
      state.stick_top_files.unshift(id)
    }
  },

  CANCEL_STICK_TOP_FILE (state, id) {
    let idx = state.stick_top_files.indexOf(id)
    state.stick_top_files.splice(idx, 1)
  },

  SET_STICK_TOP_FILES (state, arr) {
    state.stick_top_files = arr
  },

  SAVE_STICK_TOP_FILES (state) {
    LocalDAO.tops.save(state.stick_top_files)
  },

  SET_SHARE_INFO (state, obj) {
    state.share_info = obj
  }
}

const actions = {
  async SET_FILES_FROM_LOCAL ({ commit, dispatch }) {
    // fetchLocalTops().then(topFiles => {
    //   commit('SET_STICK_TOP_FILES', topFiles)
    // })
    console.log('SET_FILES_FROM_LOCAL')
    await fetchLocalFiles()
    commit('REFRESH_FILES')
    // commit('UPDATE_FOLDERS')
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    if (filesSaved.length > 0) {
      commit('UPDATE_FILES_ARR')
    }
    // dispatch('SET_FILES').then(() => {
      // dispatch('SET_DOC_BRIEF_FORM_LOCAL')
    // })
  },

  // SET_FILES ({ commit }) {
  //   // delete surplus docs
  //   commit('UPDATE_FILES')
  //   commit('UPDATE_FOLDERS')
    // commit('SAVE_FILES')
  // },

  UPDATE_FILE_BRIEF ({ commit }, obj) {
    commit('UPDATE_FILE_BRIEF', obj)
    commit('UPDATE_FILES_ARR')
  },

  UPDATE_FILE_UPDATE_AT ({ commit }, id) {
    commit('UPDATE_FILE_UPDATE_AT', id)
  },

  async SET_DOC_BRIEF_FORM_LOCAL ({ dispatch, commit }) {
    const filesContent = await fetchAllLocalDocContent()
    commit('UPDATE_DOC_MAP', filesContent)
    filesContent.forEach(content => {
      content.brief = formatContent(content.data)
      dispatch('UPDATE_FILE_BRIEF', content)
    })
  },

  async ADD_FILE ({ dispatch, commit }, obj) {
    await LocalDAO.files.add(obj).then(resp => {
      resp.cache_id = obj.cache_id
      fileTree.addFile(resp)
    })
    commit('REFRESH_FILES')
  },

  async DELETE_FILE ({ commit }, id) {
    commit('UPDATE_FILE', {
      id: id,
      trash: 'TRASH'
    })
    commit('REFRESH_FILES')
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    if (filesSaved.length > 0) {
      commit('UPDATE_FILES_ARR')
    }
  },

  async EDIT_FILE ({ commit, dispatch }, opts) {
    commit('UPDATE_FILE', opts)
    commit('REFRESH_FILES')
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    if (filesSaved.length > 0) {
      commit('UPDATE_FILES_ARR')
    }
  },

  async EDIT_DOC ({ commit, dispatch }, opts) {
    commit('EDIT_DOC', opts)
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    // if (filesSaved.length > 0) {
    //   commit('UPDATE_FILES_ARR')
    // }
  },

  async APPEND_FILE ({ commit, dispatch }, opts) {
    commit('APPEND_FILE', opts)
    commit('REFRESH_FILES')
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    if (filesSaved.length > 0) {
      commit('UPDATE_FILES_ARR')
    }
  },

  async MOVE_FILE ({ commit, dispatch }, opts) {
    commit('MOVE_FILE', opts)
    commit('REFRESH_FILES')
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    if (filesSaved.length > 0) {
      commit('UPDATE_FILES_ARR')
    }
  },

  SET_TAGS_FROM_LOCAL ({ commit }) {
    LocalDAO.tag.getAll().then(res => {
      console.log('SET_TAGS_FROM_LOCAL', res)
      commit('SET_TAGS', res)
    })
  },

  async ADD_FILE_TAG ({ commit }, opts) {
    let { id, tag } = opts
    await LocalDAO.tag.getByName(tag).then(tagObj => {
      if (!tagObj) {
        LocalDAO.tag.add({
          fileId: id,
          name: tag
        }).then(tagId => {
          commit('ADD_FILE_TAG', {
            fileId: id,
            tagId: tagObj._id
          })
          // commit('SAVE_FILES')
        })
      } else {
        LocalDAO.tag.addFile({
          fileId: id,
          tagId: tagObj._id
        }).then(() => {
          commit('ADD_FILE_TAG', {
            fileId: id,
            tagId: tagObj._id
          })
          // commit('SAVE_FILES')
        })
      }
    })
  },

  REMOVE_FILE_TAG ({ commit }, opts) {
    let { fileId, tagId } = opts
    // LocalDAO.tag.getByName(tagName).then(tagObj => {
    // if (tagObj) {
    commit('REMOVE_FILE_TAG', {
      fileId: fileId,
      tagId: tagId
    })
    // commit('SAVE_FILES')
    // }
    // })
    // commit('REMOVE_FILE_TAG', opts)
  },

  async CLEAR_ALL_RECYCLE ({ commit }) {
    commit('CLEAR_ALL_RECYCLE')
    commit('REFRESH_FILES')
    let filesSaved = await saveLocalFiles()
    commit('FILES_SAVED', filesSaved)
    if (filesSaved.length > 0) {
      commit('UPDATE_FILES_ARR')
    }
    // commit('UPDATE_FOLDERS')
    // commit('SAVE_FILES')
  },

  RESUME_ALL_RECYCLE ({ commit }) {
    commit('RESUME_ALL_RECYCLE')
    // fileTree.resumeAllRecycle().updateFlatMap()
    commit('REFRESH_FILES')
    // commit('UPDATE_FILES_ARR')
    // commit('UPDATE_FOLDERS')
    // commit('SAVE_FILES')
  },

  SET_CURRENT_FOLDER ({ commit }, id) {
    commit('SET_CURRENT_FOLDER', id)
  },

  SET_CURRENT_FILE ({ commit }, id) {
    commit('SET_CURRENT_FILE', id)
  },

  async SAVE_DOC ({ dispatch, commit }, obj) {
    const { id, html } = obj
    // await writeFile(`${appPath}/docs/${id}.xml`, html)
    LocalDAO.files.updateContent({
      id: id,
      content: html
    })
    // LocalDAO.doc.update({
    //   fileId: id,
    //   content: html
    // })
    // let content = await fetchLocalDocContent(id)
    // content.brief = formatContent(content.data)
    // await dispatch('UPDATE_FILE_BRIEF', content)
    await dispatch('UPDATE_FILE_UPDATE_AT', id)
    commit('UPDATE_FILES_ARR')
    // commit('SAVE_FILES')
    // dispatch('UPDATE_FILE_BRIEF', content).then(() => {
    //   dispatch('UPDATE_FILE_UPDATE_AT', id).then(() => {
    //   })
    // })
  },

  SAVE_FILES () { // 本地存储文件
    console.log('SAVE_FILES')
    for (let i in fileTree.flat_map) {
      let file = fileTree.flat_map[i]
      if (file.need_push_locally) {
        console.log('SAVE_FILES-11111', file.title, file.content, file)
        LocalDAO.files.update({
          id: file.data._id,
          data: file
        }).then(() => {
          file.need_push_locally = false
        })
      }
    }
  },

  SET_FILE_PUSH_FINISHED ({ commit }, obj) {
    commit('SET_FILE_PUSH_FINISHED', obj)
    LocalDAO.files.update({
      id: obj.id,
      data: {
        remote_id: obj.remote_id,
        need_push: false
      }
    })
  },

  SAVE_FILE_TITLE ({ commit }, obj) {
    commit('SAVE_FILE_TITLE', obj)
    commit('UPDATE_FILE_UPDATE_AT', obj.id)
    commit('UPDATE_FILES_ARR')
    commit('UPDATE_FOLDERS')
    // commit('SAVE_FILES')
  },

  SET_SEARCH_KEYWORD ({ commit }, str) {
    commit('SET_SEARCH_KEYWORD', str)
  },

  STICK_TOP_FILE ({ commit }, id) {
    commit('STICK_TOP_FILE', id)
    commit('SAVE_STICK_TOP_FILES')
  },

  CANCEL_STICK_TOP_FILE ({ commit }, id) {
    commit('CANCEL_STICK_TOP_FILE', id)
    commit('SAVE_STICK_TOP_FILES')
  },

  SET_SHARE_INFO ({ commit }, obj) {
    commit('SET_SHARE_INFO', obj)
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
    return state.files_arr.filter(file => file.trash === 'NORMAL')
  },

  GET_ROOT_FILES (state) {
    return state.files_arr.filter(file => !file.parent_folder)
  },

  GET_FOLEDERS (state) {
    return state.folders
  },

  GET_RECYCLE_FILES (state) {
    return state.files_arr.filter(file => file.trash === 'TRASH')
  },

  GET_CURRENT_FOLDER (state) {
    console.log('GET_CURRENT_FOLDER', state)
    if (!state.current_folder_id) {
      return null
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
        if (file.trash !== 'NORMAL') {
          return false
        }
        if (state.search_keyword !== '') {
          if (file.title.indexOf(state.search_keyword) > -1) {
            return true
          }
          if (file.id &&
            state.doc_map[file.id] &&
            formatContent(state.doc_map[file.id].data).indexOf(state.search_keyword) > -1) {
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

  GET_FILES_NEED_PUSH (state) {
    return state.files_arr.filter(item => item.need_push_remotely)
  },

  GET_ALL_TAGS (state) {
    return state.tags_arr
  },

  GET_TAGS_MAP (state) {
    return state.tags_map
  },

  // GET_ALL_TAGS_MAP (state) {
  //   return state.tags_map
  // },

  // GET_CURRENT_FILE_TAGS (state) {
  //   let tagArr = state.files_map[state.current_file_id].tags || []
  //   return tagArr.map(tagId => state.tags_map[tagId])
  // },

  GET_SEARCH_KEYWORD (state) {
    return state.search_keyword
  },

  GET_STICK_TOP_FILES (state) {
    return state.stick_top_files
  },

  GET_SHARE_INFO (state) {
    return state.share_info
  }
}

function fetchLocalFiles () {
  return new Promise((resolve, reject) => {
    LocalDAO.files.getAll().then(resp => {
      console.log('fetchLocalFiles-files', resp)
      fileTree.init(resp).updateFlatMap()
      resolve(fileTree.flat_map)
    })
  })
}

function saveLocalFiles () {
  let tasks = []
  for (let i in fileTree.flat_map) {
    let file = fileTree.flat_map[i]
    if (file.need_push_locally) {
      tasks.push(file)
      console.log('saveLocalFiles-11111', file.title, file.need_push_locally, file)
    }
  }
  return Promise.all(
    tasks.map(item => {
      return new Promise((resolve, reject) => {
        LocalDAO.files.update({
          id: item.id,
          data: item
        }).then(resp => {
          console.log('saved-1111', resp)
          item.need_push_locally = false
          resolve(item)
        })
      })
    })
  )
}

function deleteFile (id) {
  let file = fileTree.map[id]
  fileTree.updateFile({
    id: file.id,
    trash: 'DELETED'
  })
  if (file._child_folders) {
    file._child_folders.forEach(item => {
      deleteFile(item)
    })
  }
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

function fetchLocalTops () {
  return LocalDAO.tops.get()
  // return new Promise((resolve, reject) => {
  //   LocalDAO.tops.get().then(resp => {
  //     console.log('structure', resp)
  //     return resp
  //   }).then(tops => {
  //     resolve(data)
  //   })
  // })
}

function addDoc (id, isTemp) {
  return new Promise((resolve, reject) => {
    LocalDAO.doc.add({
      fileId: id,
      content: isTemp ? docTemplate : ''
    }).then(res => {
      resolve(id)
    })
  })
}

function updateChildFiles (file, state) {
  let childFiles = state.files_arr.filter(item => {
    if (item.parent_folder) {
      return item.parent_folder === file.id
    }
  })

  childFiles.forEach(child => {
    child.ancestor_folders = [...file.ancestor_folders, file.id]
    if (child.type === 'folder') {
      child.seq = file.child_folders.indexOf(child.id) + 1
      updateChildFiles(child, state)
    } else {
      child.seq = file.child_docs.indexOf(child.id) + 1
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

function markShouldUpdate (file, val) {
  if (typeof val !== 'boolean') return
  file.needPushLocally = val
  file.shouldUpdateRemote = val
  console.log('markShouldUpdate', file)
}

function createFolderData (file) {
  let result = {}
  folderKeys.forEach(name => {
    result[name] = file[name]
  })
  return result
}

export default {
  state,
  mutations,
  actions,
  getters
}
