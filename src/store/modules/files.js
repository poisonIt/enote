// import dayjs from 'dayjs'
import * as _ from 'lodash'
import { getLocalNoteByPid } from '@/service/local'

const state = {
  search_keyword: '',
  current_nav: null,
  current_file: null
}

const mutations = {
  SET_SEARCH_KEYWORD (state, str) {
    state.search_keyword = str
  },

  SET_CURRENT_NAV (state, val) {
    state.current_nav = val
  },

  SET_CURRENT_FILE (state, file) {
    state.current_file = file
  }
}

const actions = {
  SET_SEARCH_KEYWORD ({ commit }, str) {
    commit('SET_SEARCH_KEYWORD', str)
  },

  SET_CURRENT_NAV({ commit, dispatch }, val) {
    commit('SET_CURRENT_NAV', val)
  },

  SET_CURRENT_FILE ({ commit }, file) {
    commit('SET_CURRENT_FILE', file)
  }
}

const getters = {
  GET_SEARCH_KEYWORD (state) {
    return state.search_keyword
  },

  GET_CURRENT_NAV (state) {
    return state.current_nav
  },

  GET_CURRENT_FILE (state) {
    return state.current_file
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
