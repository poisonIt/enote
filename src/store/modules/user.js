const state = {
  user_info: {}
}

const mutations = {
  SET_USER_INFO (state, obj) {
    state.user_info = obj
    console.log('SET_USER_INFO', state.user_info)
  }
}

const actions = {
  SET_USER_INFO ({ commit }, obj) {
    commit('SET_USER_INFO', obj)
  }
}

const getters = {
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
