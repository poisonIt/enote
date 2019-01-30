const state = {
  view_type: 'expanded',
  name: '最新文档',
  view_folder: '',
  view_file_type: 'latest',
  view_file_list_type: 'summary',
  view_file_sort_type: 'create_at',
  view_file_sort_order: 'down',
  show_move_pannel: false,
  editor_content: ''
}

const mutations = {
  SET_VIEW_FOLDER (state, id) {
    state.view_folder = id
  },

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
  },

  SET_VIEW_FILE_LIST_TYPE (state, type) {
    state.view_file_list_type = type
  },

  SET_VIEW_FILE_SORT_TYPE (state, type) {
    state.view_file_sort_type = type
  },

  SET_VIEW_FILE_SORT_ORDER (state, order) {
    state.view_file_sort_order = order
  }
}

const actions = {
  SET_VIEW_FOLDER ({ commit }, id) {
    console.log('SET_VIEW_FOLDER', id)
    commit('SET_VIEW_FOLDER', id)
  },

  SET_VIEW_TYPE ({ commit }, type) {
    commit('SET_VIEW_TYPE', type)
  },

  SET_VIEW_NAME ({ commit }, name) {
    commit('SET_VIEW_NAME', name)
  },

  SET_VIEW_FILE_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_TYPE', type)
  },

  TOGGLE_SHOW_MOVE_PANEL ({ commit }) {
    commit('TOGGLE_SHOW_MOVE_PANEL')
  },

  SET_EDITOR_CONTENT ({ commit }, content) {
    commit('SET_EDITOR_CONTENT', content)
  },

  SET_VIEW_FILE_LIST_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_LIST_TYPE', type)
  },

  SET_VIEW_FILE_SORT_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_SORT_TYPE', type)
  },

  SET_VIEW_FILE_SORT_ORDER ({ commit }, order) {
    commit('SET_VIEW_FILE_SORT_ORDER', order)
  }
}

const getters = {
  GET_VIEW_FOLDER (state) {
    return state.view_folder
  },

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
    return state.editor_content
  },

  GET_VIEW_FILE_LIST_TYPE (state) {
    return state.view_file_list_type
  },

  GET_VIEW_FILE_SORT_TYPE (state) {
    return state.view_file_sort_type
  },

  GET_VIEW_FILE_SORT_ORDER (state) {
    return state.view_file_sort_order
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
