<template>
  <div style="width: 200px; height: 300px;background: red" @click="click"></div>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import * as _ from 'lodash'
import PQueue from 'p-queue'
import { QueueClass } from '../utils/promise'
import * as LocalService from '../service/local'
import { createCollection } from '../../db'
import { TreeStore } from '@/components/Tree'

let rootFolder = {
  name: '我的文件夹',
  id: '0',
  pid: '/',
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'folder',
    id: '0'
  }
}

// const queue = new PQueue()
const queue = new PQueue({
  autoStart: false,
  concurrency: 1,
  queueClass: QueueClass
})
let localFolderCache = []
let localNoteCache = []
let taskId = 0

export default {
  name: 'Background',

  created () {
    this.loadUserDB()
    this.createIpcListener()
  },

  methods: {
    click () {
      console.log(1)
    },

    loadUserDB () {
      const DBs = {
        folderDB: 'folder',
        noteDB: 'note',
        docDB: 'doc',
        tagDB: 'tag',
        picDB: 'pic'
      }

      const dbPath = remote.app.appConf.dbPath
      console.log('dbPath', dbPath)
      createCollection('user', dbPath)
      LocalService.getAllLocalUser().then(res => {
        console.log('user-resp', res)
      })
      ipcRenderer.send('userDB-ready')
    },

    createIpcListener () {
      ipcRenderer.on('login-ready', (event) => {
        const { user, dbPath } = remote.app.appConf
        createCollection('folder', dbPath + '/' + user)
        createCollection('note', dbPath + '/' + user)
      })
      ipcRenderer.on('fetch-local-data', (event, arg) => {
        // console.log('fetch-local-data', arg)
        taskId++
        let tasks = arg.name.map((item, index) => {
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
        console.log('res', res, tid)
        if (tid === taskId) {
          ipcRenderer.send('fetch-local-data-response', {
            res: res,
            from: arg.from
          })
        }
      })
    },

    translateNavData (folderFiles) {
      let rootChildren = folderFiles.filter(item => item.pid === '0').map((item, index) => {
        return {
          id: item._id,
          pid: item.pid,
          name: item.title,
          data: item,
          children: []
        }
      })

      rootChildren.forEach((item, index) => {
        this.getFolderChildren(item, folderFiles)
      })
      rootFolder.children = rootChildren
      return rootFolder
    },

    getFolderChildren (cur, arr) {
      cur.children = arr.filter(item => item.pid === cur.id).map(item => {
        return {
          id: item._id,
          pid: item.pid,
          name: item.title,
          data: item,
          children: []
        }
      })
      cur.children.forEach(child => {
        this.getFolderChildren(child, arr)
      })
    }
  }
}
</script>
