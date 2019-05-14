<template>
  <div>
    <div class="loading">
      <Loading :type="1" fill="#DDAF59" style="transform: scale(1.2)"></Loading>
    </div>
  </div>
</template>

<script>
import * as _ from 'lodash'
import { ipcRenderer, remote } from 'electron'
import * as LocalService from '../service/local'
import { createCollection } from '../../db'
import Loading from '@/components/Loading'

let taskId = 0
let folderDataCache = []
let tagDataCache = []

export default {
  name: 'Background',

  components: {
    Loading
  },

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
        let p = dbPath + '/' + user
        console.log('p', p)
        createCollection('folder', p)
        createCollection('note', p)
        createCollection('doc', p)
        createCollection('tag', p)
        createCollection('img', p)
        createCollection('state', p)

        // LocalService.getAllLocalFolder().then(res => {
        //   folderDataCache = res
        // })
        // LocalService.getAllLocalTag().then(res => {
        //   tagDataCache = res
        // })
      })
      ipcRenderer.on('home-window-ready', (event) => {
        console.log('home-window-ready', folderDataCache, tagDataCache)
        LocalService.getAllLocalFolder().then(res1 => {
          LocalService.getAllLocalTag().then(res2 => {
            console.log('fetch-local-data-response', res1, res2, ['getAllLocalFolder', 'getAllLocalTag'])
            ipcRenderer.send('fetch-local-data-response', {
              tasks: ['getAllLocalFolder', 'getAllLocalTag'],
              res: [res1, res2],
              from: ['NavBar']
            })
          })
        })
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
      if (arg.queue) {
        console.log('queue', arg, tasks)
        LocalService[arg.tasks[0]](arg.params[0]).then((res0) => {
          LocalService[arg.tasks[1]](arg.params[1]).then((res1) => {
            console.log('fetch-local-data-response-queue', res0, res1, arg)
            ipcRenderer.send('fetch-local-data-response', {
              res: [res0, res1],
              from: arg.from,
              queue: true,
              tasks: arg.tasks
            })
          })
        })
      } else {
        Promise.all(tasks).then(res => {
          if (tid === taskId) {
            console.log('fetch-local-data-response', res, arg)
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
}
</script>

<style lang="stylus" scoped>
.loading
  position fixed
  width 100%
  height 100%
  display flex
  align-items center
  justify-content center
  background-color #fcfbf7
  z-index 9999999
</style>

