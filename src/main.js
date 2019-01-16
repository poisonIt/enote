import Vue from 'vue'
import App from './App.vue'
import store from './store'
import CKEditor from '@ckeditor/ckeditor5-vue'
import CollapseTransition from './utils/transitions'
import Modal from './components/Modal'
const { remote, shell, webFrame } = require('electron')

Vue.use(CKEditor)
Vue.use(CollapseTransition)
Vue.use(Modal)

Vue.prototype.$remote = remote
Vue.prototype.$shell = shell
Vue.prototype.$webFrame = webFrame

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
