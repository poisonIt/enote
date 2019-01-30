import folderMenu from './folderMenu'
import resourceMenu from './resourceMenu'
import recycleMenu from './recycleMenu'

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

export {
  hookMenuEvent,
  folderMenu,
  resourceMenu,
  recycleMenu
}
