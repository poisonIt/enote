// import dayjs from 'dayjs'
import * as _ from 'lodash'
import { getLocalNoteByPid } from '@/service/local'

const state = {
  search_keyword: '',
  current_nav: null,
  current_files: [],
  current_file_id: null
}

const mutations = {
  SET_SEARCH_KEYWORD (state, str) {
    state.search_keyword = str
  },

  SET_CURRENT_NAV (state, val) {
    console.log('SET_CURRENT_NAV', val)
    state.current_nav = val
  },

  SET_CURRENT_FILES (state, val) {
    state.current_files = val
  },

  SET_CURRENT_FILE (state, id) {
    state.current_file_id = id
  },

  ADD_FILE (state, file) {
    console.log('ADD_FILE', file)
    state.current_files.push(file)
    state.current_file_id = file._id
  }
}

const actions = {
  SET_SEARCH_KEYWORD ({ commit }, str) {
    commit('SET_SEARCH_KEYWORD', str)
  },

  SET_CURRENT_NAV({ commit, dispatch }, val) {
    commit('SET_CURRENT_NAV', val)
    dispatch('SET_CURRENT_FILES', val)
  },

  async SET_CURRENT_FILES ({ commit }, nav) {
    if (nav.type === 'folder') {
      let currentFiles = await getLocalNoteByPid({ pid: nav._id })
      commit('SET_CURRENT_FILES', currentFiles)
    }
  },

  SET_CURRENT_FILE ({ commit }, id) {
    console.log('SET_CURRENT_FILE', id)
    commit('SET_CURRENT_FILE', id)
  },

  ADD_FILE ({ commit }, file) {
    commit('ADD_FILE', file)
  }
}

const getters = {
  GET_SEARCH_KEYWORD (state) {
    return state.search_keyword
  },

  GET_CURRENT_NAV (state) {
    return state.current_nav
  },

  GET_CURRENT_FILES (state) {
    return state.current_files
  },

  GET_CURRENT_FILE (state) {
    let result = _.find(state.current_files, { _id: state.current_file_id })
    console.log('GET_CURRENT_FILE', result)
    return result
    // return state.current_files.filter(item => item._id === state.current_file_id)[0]
  },
}

export default {
  state,
  mutations,
  actions,
  getters
}
