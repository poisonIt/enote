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
// import Table from '@/components/Table'
import { Alert, Message, Upload, Button, Option, Select, OptionGroup, Progress, Form, FormItem, Poptip, Scroll, Table, Input } from 'view-design'
import '@/assets/css/font-awesome.min.css'
// import 'iview/dist/styles/iview.css'
import 'view-design/dist/styles/iview.css'
import '@/assets/styles/iview.styl'
import '@/assets/styles/common.styl'
import '@/assets/css/font-family.css'
//

import { Circle } from 'vant'

Vue.use(Circle)

const isDevelopment = process.env.NODE_ENV !== 'production'

const {ipcRenderer, remote, shell, webFrame} = require('electron')
console.log(remote.app.getAppPath('userData'))

let serviceUrl = ''

Vue.use(CollapseTransition)
Vue.use(Modal)
Vue.use(BSelect)
Vue.use(BOption)
Vue.use(Menu)
Vue.component('Input', Input)
Vue.component('Table', Table)
Vue.component('Alert', Alert)
Vue.component('Upload', Upload)
Vue.component('Button', Button)
Vue.component('Select', Select)
Vue.component('Option', Option)
Vue.component('OptionGroup', OptionGroup)
Vue.component('Poptip', Poptip)
Vue.component('Scroll', Scroll)
Vue.component('Progress', Progress)

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

  // if (config.url.split('/api/')[1]) {
  //   let configArr = config.url.split('/api/')
  //   // console.log(configArr)
  //   if (configArr[1] === 'authenticate' || config.url.indexOf('user') != -1 || config.url.indexOf('stocks') != -1 || config.url.indexOf('trades') != -1 || config.url.indexOf('reportSubclass') != -1) {
  //     config.url = `${configArr[0]}/api/${configArr[1]}`
  //   // return
  //   } else {
  //     let str = 'eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE1Njg2MDQ5OTgsInN1YiI6IjI5NyIsImNyZWF0ZWQiOjE1NjgwMDAxOTg2OTF9.CistPIpXgWwtW7yElikLWhoF-A5eTBBgbthLSbw6-KdmV-dTQFM4AKdpk9jSPNCWoXbAewnOqqosgDvz0Cftog'
  //     config.headers['Authorization'] = 'Bearer' + str
  //     configArr.splice(0, 1, 'http://115.159.127.156:8000')
  //     config.url = `${configArr[0]}/api/${configArr[1]}`
  //   }
  // }

  // if (config.url.split('/api/share/')[1]) {
  //   // console.log()
  //   let str = 'eyJhbGciOiJIUzUxMiJ9.eyJleHAiOjE1Njg2MDQ5OTgsInN1YiI6IjI5NyIsImNyZWF0ZWQiOjE1NjgwMDAxOTg2OTF9.CistPIpXgWwtW7yElikLWhoF-A5eTBBgbthLSbw6-KdmV-dTQFM4AKdpk9jSPNCWoXbAewnOqqosgDvz0Cftog'
  //   config.headers['Authorization'] = 'Bearer' + str
  //   let configArr = config.url.split('/api/share/')

  //   configArr.splice(0, 1, 'http://115.159.127.156:8000')
  //   if (configArr[1] === 'withme') {
  //     config.url = `${configArr[0]}/api/share/withme`
  //   } else if (config.url.indexOf('save') != -1) {
  //     config.url = `${configArr[0]}/api/share/save/youdao`
  //   } else {
  //     config.url = `${configArr[0]}/api/share/${configArr[1]}`
  //   }
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
