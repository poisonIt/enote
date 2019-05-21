const state = {
  id_token: null,
  user_info: {}
}

const mutations = {
  SET_TOKEN (state, val) {
    state.id_token = val
  },

  SET_USER_INFO (state, obj) {
    state.user_info = obj
    console.log('SET_USER_INFO', state.user_info)
  }
}

const actions = {
  SET_TOKEN ({ commit }, val) {
    commit('SET_TOKEN', val)
  },

  SET_USER_INFO ({ commit }, obj) {
    commit('SET_USER_INFO', obj)
  }
}

const getters = {
  GET_TOKEN (state) {
    return state.id_token
  },

  GET_USER_INFO (state) {
    return state.user_info
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
