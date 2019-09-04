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
  // console.log(config)
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
  // if (config.url.split('/api/public')[1]) {
  //   let str = 'eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE1Njc3NDA5MjYsInN1YiI6IjI5NyIsImNyZWF0ZWQiOjE1NjcxMzYxMjYxOTZ9.ibPyS4u0_sPRDnx_S7I9-J1dPqIQwz5nXggXXEUF26-T7H8CU13ZqqciWyv9hq6JN2Jl-o3UZancACk98fRVkQ'
  //   config.headers['Authorization'] = 'Bearer' + str
  //   let configArr = config.url.split('/api/public')
  //   configArr.splice(0, 1, 'http://115.159.127.156:8000')
  //   config.url = `${configArr[0]}/api/public${configArr[1]}`
  // }
  return config
}, error => {
  return Promise.reject(error)
})

axios.interceptors.response.use(data => {
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
