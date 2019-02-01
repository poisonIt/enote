function hookMenuEvent (menu, target) {
  return menu.map(menuItem => {
    let newItem = menuItem
    const eventListener = newItem.eventListener
    if (eventListener) {
      newItem[eventListener.eventName] = () => {
        target[eventListener.callbackName]()
      }
    }
    if (menuItem.submenu) {
      newItem.submenu = hookMenuEvent(menuItem.submenu, target)
    }
    return newItem
  })
}

export default {
  data () {
    return {
      nativeMenus: []
    }
  },

  created () {
    this.initNativeMenus()
  },

  methods: {
    initNativeMenus () {
      this.nativeMenus = this.nativeMenuData.map(data =>
        this.createNativeMenu([...hookMenuEvent(data, this)])
      )
    },

    createNativeMenu (itemOpts) {
      const Menu = this.$remote.Menu
      const MenuItem = this.$remote.MenuItem
      let menu = new Menu()

      for (let i = 0, len = itemOpts.length; i < len; i++) {
        menu.append(new MenuItem(itemOpts[i]))
      }
      return menu
    },

    popupNativeMenu (menu) {
      menu.popup({ window: this.$remote.getCurrentWindow() })
    }
  }
}
