<template>
  <div>
    <button @click="getAllLocalFolder">getAllLocalFolder</button>
    <button @click="getLocalFolderByQuery">getLocalFolderByQuery</button>
    <input type="text" v-model="folderId" placeholder="folderId">
    <button @click="getLocalFolderById">getLocalFolderById</button>
    <button @click="getLocalTrashFolder">getLocalTrashFolder</button>
    <input type="text" v-model="folderPid" placeholder="folderPid">
    <button @click="getLocalFolderByPid">getLocalFolderByPid</button>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  name: 'TestGround',

  data () {
    return {
      folderId: '',
      folderPid: ''
    }
  },

  created () {
    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      console.log('fetch-local-data-response', arg)
    })
  },

  methods: {
    getAllLocalFolder () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getAllLocalFolder'],
        from: 'Test'
      })
    },

    getLocalFolderByQuery () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getLocalFolderByQuery'],
        params: [{
          trash: 'NORMAL'
        }],
        options: [
          {
            multi: true,
            with_parent_folder: true
          }
        ],
        from: 'Test',
      })
    },

    getLocalFolderById () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getLocalFolderById'],
        params: [{
          id: this.folderId
        }],
        from: 'Test',
      })
    },

    getLocalTrashFolder () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getLocalTrashFolder'],
        from: 'Test',
      })
    },

    getLocalFolderByPid () {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['getLocalFolderByPid'],
        params: [{
          pid: this.folderPid
        }],
        from: 'Test',
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
