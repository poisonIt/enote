<<<<<<< HEAD
const state = {
  is_user_ready: false,
  is_db_ready: false,
  network_status: 'online',
  view_type: 'expanded',
  name: '最新文档',
  move_file: '',
  view_file_type: 'latest',
  view_file_list_type: 'summary',
  view_file_sort_type: 'create_at',
  view_file_sort_order: 'down',
  selected_tags: [],
  show_move_pannel: false,
  show_user_panel: false,
  show_share_panel: false,
  show_research_panel: false,
  show_setting_panel: false,
  show_tag_handler: false,
  editor_content: '',
  editor_content_cache: '',
  cached_doc: '',
  // current_nav: null,
  is_syncing: false,
  is_editor_focused: false,
  is_home_ready: false
}

const mutations = {
  SET_USER_READY (state, val) {
    state.is_user_ready = val
  },

  SET_DB_READY (state, val) {
    state.is_db_ready = val
  },

  SET_NETWORK_STATUS (state, val) {
    state.network_status = val
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

  SET_EDITOR_CONTENT (state, content) {
    state.editor_content = content
  },

  SET_EDITOR_CONTENT_CACHE (state, content) {
    state.editor_content_cache = content
  },

  SET_CACHED_DOC (state, doc) {
    state.cached_doc = doc
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

  TOGGLE_SHOW_RESEARCH_PANEL (state, val) {
    state.show_research_panel = !!val
  },

  TOGGLE_SHOW_SETTING_PANEL (state, val) {
    state.show_setting_panel = !!val
  },

  TOGGLE_SHOW_TAG_HANDLER (state, val) {
    state.show_tag_handler = !!val
  },

  // SET_CURRENT_NAV (state, val) {
  //   state.current_nav = val
  // },

  SET_IS_SYNCING (state, val) {
    state.is_syncing = val
  },

  SET_IS_EDITOR_FOCUSED (state, val) {
    state.is_editor_focused = val
  },

  SET_IS_HOME_READY (state, val) {
    state.is_home_ready = val
  }
}

const actions = {
  SET_USER_READY({ commit }, val) {
    commit('SET_USER_READY', val)
  },

  SET_DB_READY({ commit }, val) {
    commit('SET_DB_READY', val)
  },

  SET_NETWORK_STATUS ({ commit }, val) {
    commit('SET_NETWORK_STATUS', val)
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

  SET_EDITOR_CONTENT ({ commit }, content) {
    commit('SET_EDITOR_CONTENT', content)
  },

  SET_EDITOR_CONTENT_CACHE ({ commit }, content) {
    commit('SET_EDITOR_CONTENT_CACHE', content)
  },

  SET_CACHED_DOC ({ commit }, doc) {
    commit('SET_CACHED_DOC', doc)
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

  TOGGLE_SHOW_RESEARCH_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_RESEARCH_PANEL', val)
  },

  TOGGLE_SHOW_SETTING_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_SETTING_PANEL', val)
  },

  TOGGLE_SHOW_TAG_HANDLER ({ commit }, val) {
    commit('TOGGLE_SHOW_TAG_HANDLER', val)
  },

  // SET_CURRENT_NAV ({ commit }, val) {
  //   commit('SET_CURRENT_NAV', val)
  // },

  SET_IS_SYNCING ({ commit }, val) {
    commit('SET_IS_SYNCING', val)
  },

  SET_IS_EDITOR_FOCUSED ({ commit }, val) {
    commit('SET_IS_EDITOR_FOCUSED', val)
  },

  SET_IS_HOME_READY ({ commit }, val) {
    commit('SET_IS_HOME_READY', val)
  }
}

const getters = {
  GET_USER_READY (state) {
    return state.is_user_ready
  },

  GET_DB_READY (state) {
    return state.is_db_ready
  },

  GET_NETWORK_STATUS (state) {
    return state.network_status
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

  GET_MOVE_FILE (state) {
    return state.move_file
  },

  GET_EDITOR_CONTENT (state) {
    return state.editor_content
  },

  GET_EDITOR_CONTENT_CACHE (state) {
    return state.editor_content_cache
  },

  GET_CACHED_DOC (state) {
    return state.cached_doc
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

  GET_SHOW_RESEARCH_PANEL (state) {
    return state.show_research_panel
  },

  GET_SHOW_SETTING_PANEL (state) {
    return state.show_setting_panel
  },

  GET_SHOW_TAG_HANDLER (state) {
    return state.show_tag_handler
  },

  // GET_CURRENT_NAV (state) {
  //   return state.current_nav
  // },

  GET_IS_SYNCING (state) {
    return state.is_syncing
  },

  GET_IS_EDITOR_FOCUSED (state) {
    return state.is_editor_focused
  },

  GET_IS_HOME_READY (state) {
    return state.is_home_ready
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
=======
const state = {
  is_user_ready: false,
  is_db_ready: false,
  network_status: 'online',
  view_type: 'expanded',
  name: '最新文档',
  move_file: '',
  view_file_type: 'latest',
  view_file_list_type: 'summary',
  view_file_sort_type: 'create_at',
  view_file_sort_order: 'down',
  selected_tags: [],
  show_move_pannel: false,
  show_user_panel: false,
  show_share_panel: false,
  show_history_panel: false,
  show_research_panel: false,
  show_setting_panel: false,
  show_tag_handler: false,
  editor_content: '',
  editor_content_cache: '',
  cached_doc: '',
  // current_nav: null,
  is_syncing: false,
  notes_pushing: [],
  is_editor_focused: false,
  is_home_ready: false
}

const mutations = {
  SET_USER_READY (state, val) {
    state.is_user_ready = val
  },

  SET_DB_READY (state, val) {
    state.is_db_ready = val
  },

  SET_NETWORK_STATUS (state, val) {
    state.network_status = val
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

  SET_EDITOR_CONTENT (state, content) {
    state.editor_content = content
  },

  SET_EDITOR_CONTENT_CACHE (state, content) {
    state.editor_content_cache = content
  },

  SET_CACHED_DOC (state, doc) {
    state.cached_doc = doc
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

  TOGGLE_SHOW_HISTORY_PANEL (state, val) {
    state.show_history_panel = !!val
  },

  TOGGLE_SHOW_RESEARCH_PANEL (state, val) {
    state.show_research_panel = !!val
  },

  TOGGLE_SHOW_SETTING_PANEL (state, val) {
    state.show_setting_panel = !!val
  },

  TOGGLE_SHOW_TAG_HANDLER (state, val) {
    state.show_tag_handler = !!val
  },

  // SET_CURRENT_NAV (state, val) {
  //   state.current_nav = val
  // },

  SET_IS_SYNCING (state, val) {
    state.is_syncing = val
  },

  SET_NOTES_PUSHING (state, val) {
    state.notes_pushing = val
  },

  SET_IS_EDITOR_FOCUSED (state, val) {
    state.is_editor_focused = val
  },

  SET_IS_HOME_READY (state, val) {
    state.is_home_ready = val
  }
}

const actions = {
  SET_USER_READY({ commit }, val) {
    commit('SET_USER_READY', val)
  },

  SET_DB_READY({ commit }, val) {
    commit('SET_DB_READY', val)
  },

  SET_NETWORK_STATUS ({ commit }, val) {
    commit('SET_NETWORK_STATUS', val)
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

  SET_EDITOR_CONTENT ({ commit }, content) {
    commit('SET_EDITOR_CONTENT', content)
  },

  SET_EDITOR_CONTENT_CACHE ({ commit }, content) {
    commit('SET_EDITOR_CONTENT_CACHE', content)
  },

  SET_CACHED_DOC ({ commit }, doc) {
    commit('SET_CACHED_DOC', doc)
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

  TOGGLE_SHOW_HISTORY_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_HISTORY_PANEL', val)
  },

  TOGGLE_SHOW_RESEARCH_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_RESEARCH_PANEL', val)
  },

  TOGGLE_SHOW_SETTING_PANEL ({ commit }, val) {
    commit('TOGGLE_SHOW_SETTING_PANEL', val)
  },

  TOGGLE_SHOW_TAG_HANDLER ({ commit }, val) {
    commit('TOGGLE_SHOW_TAG_HANDLER', val)
  },

  // SET_CURRENT_NAV ({ commit }, val) {
  //   commit('SET_CURRENT_NAV', val)
  // },

  SET_IS_SYNCING ({ commit }, val) {
    commit('SET_IS_SYNCING', val)
  },

  SET_NOTES_PUSHING ({ commit }, val) {
    console.log('SET_NOTES_PUSHING', val)
    commit('SET_NOTES_PUSHING', val)
  },

  SET_IS_EDITOR_FOCUSED ({ commit }, val) {
    commit('SET_IS_EDITOR_FOCUSED', val)
  },

  SET_IS_HOME_READY ({ commit }, val) {
    commit('SET_IS_HOME_READY', val)
  }
}

const getters = {
  GET_USER_READY (state) {
    return state.is_user_ready
  },

  GET_DB_READY (state) {
    return state.is_db_ready
  },

  GET_NETWORK_STATUS (state) {
    return state.network_status
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

  GET_MOVE_FILE (state) {
    return state.move_file
  },

  GET_EDITOR_CONTENT (state) {
    return state.editor_content
  },

  GET_EDITOR_CONTENT_CACHE (state) {
    return state.editor_content_cache
  },

  GET_CACHED_DOC (state) {
    return state.cached_doc
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

  GET_SHOW_HISTORY_PANEL (state) {
    return state.show_history_panel
  },

  GET_SHOW_RESEARCH_PANEL (state) {
    return state.show_research_panel
  },

  GET_SHOW_SETTING_PANEL (state) {
    return state.show_setting_panel
  },

  GET_SHOW_TAG_HANDLER (state) {
    return state.show_tag_handler
  },

  // GET_CURRENT_NAV (state) {
  //   return state.current_nav
  // },

  GET_IS_SYNCING (state) {
    return state.is_syncing
  },

  GET_NOTES_PUSHING (state) {
    return state.notes_pushing
  },

  GET_IS_EDITOR_FOCUSED (state) {
    return state.is_editor_focused
  },

  GET_IS_HOME_READY (state) {
    return state.is_home_ready
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
>>>>>>> fce3240f27d5c31a50153686d8f74ec33e638c1b
