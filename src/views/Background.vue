<template>
  <div></div>
</template>

<script>
import { ipcRenderer } from 'electron'
import * as LocalService from '../service/local'
import { TreeStore } from '@/components/Tree'

let rootFolder = {
  name: '我的文件夹',
  id: '0',
  pid: null,
  dragDisabled: true,
  addTreeNodeDisabled: true,
  addLeafNodeDisabled: true,
  editNodeDisabled: true,
  delNodeDisabled: true,
  children: [],
  data: {
    type: 'folder'
  }
}

export default {
  name: 'Background',

  created () {
    ipcRenderer.on('fetch-local-data', (event, arg) => {
      let tasks = arg.name.map((item, index) => {
        if (arg.params) {
          return LocalService[item](arg.params[index])
        } else {
          return LocalService[item]()
        }
      })
      Promise.all(tasks).then(res => {
        ipcRenderer.send('fetch-local-data-response', {
          res: res,
          from: arg.from
        })
      })
    })
  },

  methods: {
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
      console.log('rootFolder', rootFolder)
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
