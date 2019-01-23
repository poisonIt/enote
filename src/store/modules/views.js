const state = {
  view_type: 'expanded',
  name: '最新文档',
  view_file_type: 'latest',
  show_move_pannel: false,
  editor_content: ''
}

const mutations = {
  SET_VIEW_TYPE (state, type) {
    state.view_type = type
  },

  SET_VIEW_NAME (state, name) {
    state.name = name
  },

  SET_VIEW_FILE_TYPE (state, type) {
    state.view_file_type = type
  },

  TOGGLE_SHOW_MOVE_PANEL (state, val) {
    state.show_move_pannel = !state.show_move_pannel
  },

  SET_EDITOR_CONTENT (state, content) {
    state.editor_content = content
  }
}

const actions = {
  SET_VIEW_TYPE ({ commit }, type) {
    commit('SET_VIEW_TYPE', type)
  },

  SET_VIEW_NAME ({ commit }, name) {
    console.log('SET_VIEW_NAME', name)
    commit('SET_VIEW_NAME', name)
  },

  SET_VIEW_FILE_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_TYPE', type)
  },

  TOGGLE_SHOW_MOVE_PANEL ({ commit }) {
    commit('TOGGLE_SHOW_MOVE_PANEL')
  },

  SET_EDITOR_CONTENT ({ commit }, content) {
    console.log('SET_EDITOR_CONTENT', content)
    commit('SET_EDITOR_CONTENT', content)
  }
}

const getters = {
  GET_VIEW_TYPE (state) {
    return state.view_type
  },

  GET_VIEW_NAME (state) {
    return state.name
  },

  GET_VIEW_FILE_TYPE (state) {
    return state.view_file_type
  },

  GET_SHOW_MOVE_PANEL (state) {
    return state.show_move_pannel
  },

  GET_EDITOR_CONTENT (state) {
    console.log('GET_EDITOR_CONTENT', state.editor_content)
    return state.editor_content
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
