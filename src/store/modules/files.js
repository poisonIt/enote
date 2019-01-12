const state = {
  files: [],
  folders: [],
  recycle: []
}

const mutations = {
  SET_FILES (state, arr) {
    state.files = arr
  },

  ADD_FILES (state, obj) {
    state.files.push(obj)
  }
}

const actions = {
  SET_FILES ({ commit }, arr) {
    commit('SET_FILES', arr)
  },

  ADD_FILES ({ commit }, obj) {
    commit('ADD_FILES', obj)
  }
}

const getters = {
  GET_FILES (state) {
    return state.files
  },

  GET_LATEST_FILES (state) {
    let result = [...state.files]
    if (result.length > 0) {
      return result
        .filter(file => file.type !== 'folder')
        .sort((a, b) => {
          return (new Date(b.update_at)).getTime() - (new Date(b.update_at)).getTime()
        })
    } else {
      return []
    }
  },

  GET_FOLEDERS (state) {
    return state.files.filter(file => file.type === 'folder')
  },

  GET_RECYCLE (state) {
    return state.recycle
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
