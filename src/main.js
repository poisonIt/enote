import Vue from 'vue'
import App from './App.vue'
import router from './route'
import store from './store'
import axios from 'axios'
import Worker from 'worker-loader!./file.worker.js'
import EventHub from '@/utils/eventhub'
import CollapseTransition from '@/utils/transitions'
import Modal from '@/components/Modal'
import BSelect from '@/components/Select'
import BOption from '@/components/Option'
import Menu from '@/components/Menu'
import { Message, Upload, Button, Select, Option, Form, FormItem } from 'iview'
import '@/assets/css/font-awesome.min.css'
import 'iview/dist/styles/iview.css'
import '@/assets/styles/iview.styl'
import '@/assets/styles/common.styl'

const { remote, shell, webFrame } = require('electron')
console.log(remote.app.getAppPath('userData'))

const serviceUrl = 'http://122.152.201.59:8000/api'

Vue.use(CollapseTransition)
Vue.use(Modal)
Vue.use(BSelect)
Vue.use(BOption)
Vue.use(Menu)
Vue.component('Upload', Upload)
Vue.component('Button', Button)
Vue.component('Select', Select)
Vue.component('Option', Option)
// Vue.component('Form', Form)
Vue.component('FormItem', FormItem)
Vue.prototype.$Message = Message
Vue.prototype.$hub = EventHub

Vue.prototype.$remote = remote
Vue.prototype.$shell = shell
Vue.prototype.$webFrame = webFrame

// console.log('Worker', Worker)
let worker = new Worker()
Vue.prototype.$worker = new Worker()
// worker.postMessage(1)

// const curWin = remote.getCurrentWindow()
// const ses = curWin.webContents.session
// const app = remote.app
// console.log(app, ses.getUserAgent())
// shell.beep()
// console.log(curWin.webContents)

axios.interceptors.request.use(config => {
  config.url = `${serviceUrl}${config.url}`
  if (store.state.user.id_token) {
    config.headers['Authorization'] = 'Bearer' + store.state.user.id_token
  }
  if (config.method === 'delete' && config.url.indexOf('deleteTag') === -1) {
    let formData = new FormData()
    Object.keys(config.data).forEach(key => {
      formData.append(key, config.data[key])
    })
    config.data = formData
  }
  return config
}, error => {
  Message.error(error)
  return Promise.reject(error)
})

// axios.interceptors.response.use(data => {
//   store.state.loadState = false
//   if (data.data.returnCode === 200){
//     Message.success(data.data.returnMsg)
//     return data
//   } else {
//     Message.error(data.data.returnMsg)
//     return data
//   }
// }, error => {
//   Message.error(error)
//   return Promise.reject(error)
// })

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
