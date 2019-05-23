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
import { fetchLocal } from '../utils/communicate'

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
      fetchLocal(
        'getAllLocalFolder',
        'Test',
        (res) => {
          console.log('fetchLocal-getAllLocalFolder', res)
        }
      )
    },

    getLocalFolderByQuery () {
      // fetchLocal(
      //   'getLocalFolderByQuery',
      //   'Test',
      //   { trash: 'NORMAL' },
      //   {
      //     multi: true,
      //     with_parent_folder: true
      //   },
      //   (res) => {
      //     console.log('fetchLocal-getLocalFolderByQuery', res)
      //   }
      // )
      fetchLocal(
        'getLocalFolderByQuery',
        'Test',
        { trash: 'NORMAL' },
        {
          multi: true,
          with_parent_folder: true
        }
      ).then(res => {
        console.log('fetchLocal-getLocalFolderByQuery-p', res)
      })
    },

    getLocalFolderById () {
      fetchLocal(
        'getLocalFolderById',
        'Test',
        { id: this.folderId },
        (res) => {
          console.log('fetchLocal-getLocalFolderById', res)
        }
      )
    },

    getLocalTrashFolder () {
      fetchLocal(
        'getLocalTrashFolder',
        'Test',
        (res) => {
          console.log('fetchLocal-getLocalTrashFolder', res)
        }
      )
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
