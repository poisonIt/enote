<template>
  <div style="width: 200px; height: 300px;background: red" @click="click"></div>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import * as _ from 'lodash'
import PQueue from 'p-queue'
import { QueueClass } from '../utils/promise'
import * as LocalService from '../service/local'
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
const mockArr = [[
  {
    create_at: 1556180761000,
    folder_title: "我的文件夹",
    need_push: false,
    pid: '0',
    seq: 0,
    title: 'xxxxxx',
    trash: "NORMAL",
    type: 'folder',
    update_at: 1556180761000,
    _id: '11111'
  },
  {
    create_at: 1556180761000,
    folder_title: "我的文件夹",
    need_push: false,
    pid: '0',
    seq: 0,
    title: 'yyyyyyy',
    trash: "NORMAL",
    type: 'folder',
    update_at: 1556180761000,
    _id: '22222'
  }
], []]

// for (let i = 0; i < 1400; i++) {
//   mockArr[1].push({
//     create_at: 1556180761000,
//     need_push: false,
//     pid: "0",
//     remote_id: "5cc16f19192ec2630ea36511" + i,
//     seq: 0,
//     tags: [],
//     title: "中国" + i,
//     top: false,
//     trash: "NORMAL",
//     type: "note",
//     update_at: 1556180761000,
//     _id: "004S62qIWhmCmIkv" + i
//   })
// }

// const queue = new PQueue()
const queue = new PQueue({ queueClass: QueueClass })

export default {
  name: 'Background',

  created () {
    ipcRenderer.on('fetch-local-data', (event, arg) => {
      let tasks = arg.name.map((item, index) => {
        // if (arg.from === 'DocumentList') {
        //   return getAll()
        // }
        if (arg.params) {
          return LocalService[item](arg.params[index])
        } else {
          return LocalService[item]()
        }
      })
      // queue.pause()
      // queue.clear()
      // queue.queue.dequeue()
      // queue.add(
        Promise.all(tasks).then(res => {
          console.log('res', res)
          ipcRenderer.send('fetch-local-data-response', {
            res: res,
            from: arg.from
          })
        })
      // )
      // queue.start()
    })
  },

  methods: {
    click () {
      console.log(1)
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
