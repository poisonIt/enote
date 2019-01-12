const state = {
  name: '最新文档',
  view_file_type: 'latest'
}

const mutations = {
  SET_VIEW_NAME (state, name) {
    state.name = name
  },

  SET_VIEW_FILE_TYPE (state, type) {
    state.view_file_type = type
  }
}

const actions = {
  SET_VIEW_NAME ({ commit }, name) {
    commit('SET_VIEW_NAME', name)
  },

  SET_VIEW_FILE_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_TYPE', type)
  }
}

const getters = {
  GET_VIEW_NAME (state) {
    return state.name
  },
  
  GET_VIEW_FILE_TYPE (state) {
    return state.view_file_type
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
