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
console.log(remote.app.database)

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
const { files_db } = remote.app.database

// files_db.remove({}, { multi: true }, function (err, numRemoved) {
//   console.log(numRemoved + ' docs removed' )
// })

files_db.find({}, (err, docs) => {
  if (err) {
    console.error(err)
  } else {
    console.log('all documents in collection files_db:', docs)
    if (docs.length === 0) {
      console.log('init files_db')
      files_db.insert({
        '000000': {
          id: '000000',
          type: 'folder',
          title: '我的文件夹',
          content: '',
          create_at: new Date(),
          update_at: new Date(),
          file_size: 0,
          file_path: ['/'],
          ancestor_folders: [],
          child_folders: []
        }
      }, () => {

      })
    }
  }
})

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
