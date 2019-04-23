import Vue from 'vue'
import App from './App.vue'
import router from './route'
import store from './store'
import axios from 'axios'
import CKEditor from '@ckeditor/ckeditor5-vue'
import EventHub from '@/utils/eventhub'
import CollapseTransition from '@/utils/transitions'
import Modal from '@/components/Modal'
import BSelect from '@/components/Select'
import BOption from '@/components/Option'
import Menu from '@/components/Menu'
import { Message, Upload, Button } from 'iview'
import '@/assets/css/font-awesome.min.css'
import 'iview/dist/styles/iview.css'
import '@/assets/styles/iview.styl'
import '@/assets/styles/common.styl'

const { remote, shell, webFrame } = require('electron')
console.log(remote.app.getAppPath())

const serviceUrl = 'http://122.152.201.59:8000/api'

Vue.use(CKEditor)
Vue.use(CollapseTransition)
Vue.use(Modal)
Vue.use(BSelect)
Vue.use(BOption)
Vue.use(Menu)
Vue.component('Upload', Upload)
Vue.component('Button', Button)
Vue.prototype.$Message = Message
Vue.prototype.$hub = EventHub

Vue.prototype.$remote = remote
Vue.prototype.$shell = shell
Vue.prototype.$webFrame = webFrame

// const curWin = remote.getCurrentWindow()
// const ses = curWin.webContents.session
// const app = remote.app
// console.log(app, ses.getUserAgent())
// shell.beep()
// console.log(curWin.webContents)

axios.interceptors.request.use(config => {
  console.log('interceptors', store, config)
  config.url = `${serviceUrl}${config.url}`
  if (store.state.user.id_token) {
    config.headers['Authorization'] = 'Bearer' + store.state.user.id_token
  }
  if (config.method === 'delete') {
    console.log('config-data', config.data)
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

axios.interceptors.response.use(data => {
  store.state.loadState = false
  if (data.data.returnCode === 200){
    Message.success(data.data.returnMsg)
    return data
  } else {
    Message.error(data.data.returnMsg)
    return data
  }
}, error => {
  Message.error(error)
  return Promise.reject(error)
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
