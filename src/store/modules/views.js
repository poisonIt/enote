const state = {
  name: '最新文档',
  view_file_type: 'latest',
  show_move_pannel: false
}

const mutations = {
  SET_VIEW_NAME (state, name) {
    state.name = name
  },

  SET_VIEW_FILE_TYPE (state, type) {
    state.view_file_type = type
  },

  TOGGLE_SHOW_MOVE_PANEL (state, val) {
    state.show_move_pannel = !state.show_move_pannel
  }
}

const actions = {
  SET_VIEW_NAME ({ commit }, name) {
    commit('SET_VIEW_NAME', name)
  },

  SET_VIEW_FILE_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_TYPE', type)
  },

  TOGGLE_SHOW_MOVE_PANEL ({ commit }) {
    commit('TOGGLE_SHOW_MOVE_PANEL')
  }
}

const getters = {
  GET_VIEW_NAME (state) {
    return state.name
  },
  
  GET_VIEW_FILE_TYPE (state) {
    return state.view_file_type
  },

  GET_SHOW_MOVE_PANEL (state) {
    return state.show_move_pannel
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
