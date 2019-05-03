<template>
  <div style="width: 200px; height: 300px;background: red" @click="click"></div>
</template>

<script>
import * as _ from 'lodash'
import { ipcRenderer, remote } from 'electron'
import * as LocalService from '../service/local'
import { createCollection } from '../../db'

let taskId = 0
let folderDataCache = []

export default {
  name: 'Background',

  data () {
    return {
      user: null
    }
  },

  created () {
    this.loadUserDB()
    this.createIpcListener()
  },

  methods: {
    click () {
      console.log(1)
    },

    loadUserDB () {
      const dbPath = remote.app.appConf.dbPath
      createCollection('user', dbPath)
      ipcRenderer.send('userDB-ready')
    },

    createIpcListener () {
      ipcRenderer.on('login-ready', (event) => {
        const { user, dbPath } = remote.app.appConf
        this.user = user
        createCollection('folder', dbPath + '/' + user)
        createCollection('note', dbPath + '/' + user)
        createCollection('doc', dbPath + '/' + user)

        LocalService.getAllLocalFolder().then(res => {
          folderDataCache = res
        })
      })
      ipcRenderer.on('home-window-ready', (event) => {
        ipcRenderer.send('fetch-local-data', {
          tasks: ['getAllLocalFolder'],
          res: folderDataCache,
          from: ['NavBar']
        })
        folderDataCache = []
      })
      ipcRenderer.on('fetch-user-data', (event, arg) => {
        console.log('fetch-user-data', arg, this.user)
        LocalService.getLocalUserById({ id: this.user }).then(res => {
          ipcRenderer.send('fetch-user-data-response', {
            res: res,
            from: arg.from
          })
        })
      })
      ipcRenderer.on('fetch-local-data', (event, arg) => {
        console.log('fectch-local-data', arg)
        taskId++
        let tasks = arg.tasks.map((item, index) => {
          if (arg.params) {
            return LocalService[item](arg.params[index])
          } else {
            return LocalService[item]()
          }
        })
        this.execPromise(taskId, tasks, arg)
      })
    },

    execPromise (id, tasks, arg) {
      let tid = id
      Promise.all(tasks).then(res => {
        if (tid === taskId) {
          console.log('fetch-local-data-response', res)
          ipcRenderer.send('fetch-local-data-response', {
            res: res,
            from: arg.from,
            tasks: arg.tasks
          })
        }
      })
    }
  }
}
</script>
