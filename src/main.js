import Vue from 'vue'
import App from './App.vue'
import store from './store'
import CKEditor from '@ckeditor/ckeditor5-vue'
import EventHub from '@/utils/eventhub'
import CollapseTransition from '@/utils/transitions'
import Modal from '@/components/Modal'
import Menu from '@/components/Menu'
const { remote, shell, webFrame } = require('electron')
console.log(remote.app.getAppPath())

Vue.use(CKEditor)
Vue.use(CollapseTransition)
Vue.use(Modal)
Vue.use(Menu)

Vue.prototype.$remote = remote
Vue.prototype.$shell = shell
Vue.prototype.$webFrame = webFrame
Vue.prototype.$hub = EventHub

// const curWin = remote.getCurrentWindow()
// const ses = curWin.webContents.session
// const app = remote.app
// console.log(app, ses.getUserAgent())
// shell.beep()
// console.log(curWin.webContents)

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
