const state = {
  view_type: 'expanded',
  name: '最新文档',
  move_file: '',
  view_folder: '',
  view_file_type: 'latest',
  view_file_list_type: 'summary',
  view_file_sort_type: 'create_at',
  view_file_sort_order: 'down',
  selected_tags: [],
  show_move_pannel: false,
  show_user_panel: false,
  show_share_panel: false,
  show_tag_handler: false,
  editor_content: '',
  editor_content_cache: '',
  current_nav: null,
  is_syncing: false
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

  SET_SELECTED_TAGS (state, tags) {
    state.selected_tags = tags
  },

  SET_EDITOR_CONTENT (state, content) {
    state.editor_content = content
  },

  SET_EDITOR_CONTENT_CACHE (state, content) {
    state.editor_content_cache = content
  },

  SET_VIEW_FILE_LIST_TYPE (state, type) {
    state.view_file_list_type = type
  },

  SET_VIEW_FILE_SORT_TYPE (state, type) {
    state.view_file_sort_type = type
  },

  SET_VIEW_FILE_SORT_ORDER (state, order) {
    state.view_file_sort_order = order
  },

  TOGGLE_SHOW_MOVE_PANEL (state, id) {
    state.move_file = id || null
    state.show_move_pannel = !state.show_move_pannel
  },

  TOGGLE_SHOW_USER_PANEL (state, val) {
    state.show_user_panel = !!val
  },

  TOGGLE_SHOW_SHARE_PANEL (state, val) {
    state.show_share_panel = !!val
  },

  TOGGLE_SHOW_TAG_HANDLER (state, val) {
    state.show_tag_handler = !!val
  },

  SET_CURRENT_NAV (state, val) {
    state.current_nav = val
  },

  SET_IS_SYNCING (state, val) {
    state.is_syncing = val
  }
}

const actions = {
  SET_VIEW_FOLDER ({ commit }, id) {
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

  SET_SELECTED_TAGS ({ commit }, tags) {
    commit('SET_SELECTED_TAGS', tags)
  },

  SET_EDITOR_CONTENT ({ commit }, content) {
    commit('SET_EDITOR_CONTENT', content)
  },

  SET_EDITOR_CONTENT_CACHE ({ commit }, content) {
    commit('SET_EDITOR_CONTENT_CACHE', content)
  },

  SET_VIEW_FILE_LIST_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_LIST_TYPE', type)
  },

  SET_VIEW_FILE_SORT_TYPE ({ commit }, type) {
    commit('SET_VIEW_FILE_SORT_TYPE', type)
  },

  SET_VIEW_FILE_SORT_ORDER ({ commit }, order) {
    commit('SET_VIEW_FILE_SORT_ORDER', order)
  },

  TOGGLE_SHOW_MOVE_PANEL ({ commit }, id) {
    commit('TOGGLE_SHOW_MOVE_PANEL', id)
  },

  TOGGLE_SHOW_USER_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_USER_PANEL', val)
  },

  TOGGLE_SHOW_SHARE_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_SHARE_PANEL', val)
  },

  TOGGLE_SHOW_TAG_HANDLER ({ commit }, val) {
    commit('TOGGLE_SHOW_TAG_HANDLER', val)
  },

  SET_CURRENT_NAV ({ commit }, val) {
    commit('SET_CURRENT_NAV', val)
  },

  SET_IS_SYNCING ({ commit }, val) {
    commit('SET_IS_SYNCING', val)
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

  GET_SELECTED_TAGS (state) {
    return state.selected_tags
  },

  GET_MOVE_FILE (state) {
    return state.move_file
  },

  GET_EDITOR_CONTENT (state) {
    return state.editor_content
  },

  GET_EDITOR_CONTENT_CACHE (state) {
    return state.editor_content_cache
  },

  GET_VIEW_FILE_LIST_TYPE (state) {
    return state.view_file_list_type
  },

  GET_VIEW_FILE_SORT_TYPE (state) {
    return state.view_file_sort_type
  },

  GET_VIEW_FILE_SORT_ORDER (state) {
    return state.view_file_sort_order
  },

  GET_SHOW_MOVE_PANEL (state) {
    return state.show_move_pannel
  },

  GET_SHOW_USER_PANEL (state) {
    return state.show_user_panel
  },

  GET_SHOW_SHARE_PANEL (state) {
    return state.show_share_panel
  },

  GET_SHOW_TAG_HANDLER (state) {
    return state.show_tag_handler
  },

  GET_CURRENT_NAV (state) {
    return state.current_nav
  },

  GET_IS_SYNCING (state) {
    return state.is_syncing
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
