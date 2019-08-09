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
import {
  Alert,
  Message,
  Upload,
  Button,
  Select,
  Option,
  Form,
  FormItem,
  Poptip
} from 'iview'
import '@/assets/css/font-awesome.min.css'
import 'iview/dist/styles/iview.css'
import '@/assets/styles/iview.styl'
import '@/assets/styles/common.styl'
import '@/assets/css/font-family.css'

const isDevelopment = process.env.NODE_ENV !== 'production'

const {
  ipcRenderer,
  remote,
  shell,
  webFrame
} = require('electron')
console.log(remote.app.getAppPath('userData'))

let serviceUrl = ''

Vue.use(CollapseTransition)
Vue.use(Modal)
Vue.use(BSelect)
Vue.use(BOption)
Vue.use(Menu)
Vue.component('Alert', Alert)
Vue.component('Upload', Upload)
Vue.component('Button', Button)
Vue.component('Select', Select)
Vue.component('Option', Option)
Vue.component('Poptip', Poptip)
// Vue.component('Form', Form)
// Vue.component('FormItem', FormItem)
Vue.prototype.$Message = Message
Vue.prototype.$hub = EventHub

Vue.prototype.$remote = remote
Vue.prototype.$shell = shell
Vue.prototype.$webFrame = webFrame

let worker = new Worker()
Vue.prototype.$worker = new Worker()

axios.interceptors.request.use(config => {
  config.url = `${remote.app.appConf.serviceUrl}${config.url}`
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
  if (store.state.views.public && config.url.indexOf('public') === -1) {
    // console.log(config.url)
    // config.url = `http://115.159.127.156:8000/api${config.url}`
  } else {
    // remote.app.appConf.serviceUrl = 'https://iapp.htffund.com/note/api'
  }

  return config
}, error => {
  return Promise.reject(error)
})

axios.interceptors.response.use(data => {
  console.log(data)
  if (data.config.url.indexOf('authenticate') > -1) {
    return data
  }
  if (data.config.url.indexOf('validateToken') > -1) {
    return data
  }
  if (data.data) {
    if (data.data.returnCode !== 200) {
      if (data.data.returnMsg !== undefined) {
        Message.error(data.data.returnMsg)
      } else {
        Message.error(data.data)
      }
    }
  }
  return data
}, error => {
  return Promise.reject(error)
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
