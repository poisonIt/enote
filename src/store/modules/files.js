// import dayjs from 'dayjs'
import * as _ from 'lodash'

const state = {
  search_keyword: '',
  current_nav: '0',
  current_file: null,
  duplicate_file: null,
  dragging_file: null,
  selected_tags: [],
  note_ver: 0
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

  SET_DUPLICATE_FILE (state, file) {
    state.duplicate_file = file
  },

  SET_DRAGGING_FILE (state, file) {
    state.dragging_file = file
  },

  SET_NOTE_VER (state, val) {
    state.note_ver = val
  },

  TOGGLE_SELECTED_TAG (state, params) {
    let { id } = params
    let idx = state.selected_tags.indexOf(id)

    if (idx > -1) {
      state.selected_tags.splice(idx, 1)
    } else {
      state.selected_tags.push(id)
    }
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

  SET_DUPLICATE_FILE ({ commit }, file) {
    commit('SET_DUPLICATE_FILE', file)
  },

  SET_DRAGGING_FILE ({ commit }, file) {
    commit('SET_DRAGGING_FILE', file)
  },

  SET_NOTE_VER ({ commit }, val) {
    commit('SET_NOTE_VER', val)
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

  GET_DUPLICATE_FILE (state) {
    return state.duplicate_file
  },

  GET_DRAGGING_FILE (state, file) {
    return state.dragging_file
  },

  GET_SELECTED_TAGS (state) {
    return state.selected_tags
  },

  GET_NOTE_VER (state) {
    return state.note_ver
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
