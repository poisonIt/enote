// import dayjs from 'dayjs'
import * as _ from 'lodash'
import { getLocalNoteByPid } from '@/service/local'

const state = {
  search_keyword: '',
  current_nav: null,
  current_file: null,
  selected_tags: []
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
  },

  UPDATE_CURRENT_FILE (state, params) {
    Object.keys(params).forEach(key => {
      if (state.current_file.hasOwnProperty(key)) {
        state.current_file[key] = params[key]
      }
    })
  },

  TOGGLE_SELECTED_TAG (state, params) {
    let { id } = params
    let idx = state.selected_tags.indexOf(id)

    if (idx > -1) {
      state.selected_tags.splice(idx, 1)
    } else {
      state.selected_tags.push(id)
    }
    console.log('TOGGLE_SELECTED_TAG', id, state.selected_tags)
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
  },

  UPDATE_CURRENT_FILE ({ commit }, params) {
    commit('UPDATE_CURRENT_FILE', params)
  },

  TOGGLE_SELECTED_TAG ({ commit }, params) {
    commit('TOGGLE_SELECTED_TAG', params)
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
  },

  GET_SELECTED_TAGS (state) {
    return state.selected_tags
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
