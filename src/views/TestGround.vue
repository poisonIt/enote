<template>
  <div>
    folder:
    <button @click="getAllLocalFolder">getAllLocalFolder</button>
    <button @click="getLocalFolderByQuery">getLocalFolderByQuery</button>
    <input type="text" v-model="folderId" placeholder="folderId">
    <button @click="getLocalFolderById">getLocalFolderById</button>
    <button @click="getLocalTrashFolder">getLocalTrashFolder</button>
    <input type="text" v-model="folderPid" placeholder="folderPid">
    <button @click="getLocalFolderByPid">getLocalFolderByPid</button>

    note:
    <button @click="getAllLocalNote">getAllLocalNote</button>
    <input type="text" v-model="notePid" placeholder="notePid">
    <button @click="getLocalNoteByPid">getLocalNoteByPid</button>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import fetchLocal from '../utils/fetchLocal'

export default {
  name: 'TestGround',

  data () {
    return {
      folderId: '',
      folderPid: '',
      notePid: ''
    }
  },

  created () {
    ipcRenderer.on('fetch-local-data-response', (event, arg) => {
      console.log('fetch-local-data-response', arg)
    })
  },

  methods: {
    getAllLocalFolder () {
      fetchLocal('getLocalFolderByQuery', {}, { multi: true }).then(res => {
        console.log('fetchLocal-getAllLocalFolder-p', res)
      })
    },

    getLocalFolderByQuery () {
      fetchLocal(
        'getLocalFolderByQuery',
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
        { id: this.folderId },
      ).then(res => {
        console.log('fetchLocal-getLocalFolderById', res)
      })
    },

    getLocalTrashFolder () {
      fetchLocal('getLocalTrashFolder').then(res => {
        console.log('fetchLocal-getLocalTrashFolder', res)
      })
    },

    getLocalFolderByPid () {
      fetchLocal(
        'getLocalFolderByPid',
        { pid: this.folderPid },
      ).then(res => {
        console.log('fetchLocal-getLocalFolderByPid-p', res)
      })
    },

    getAllLocalNote () {
      fetchLocal('getAllLocalNote').then(res => {
        console.log('fetchLocal-getAllLocalNote-p', res)
      })
    },

    getLocalNoteByPid () {
      fetchLocal(
        'getLocalNoteByPid',
        { pid: this.notePid },
      ).then(res => {
        console.log('fetchLocal-getLocalFolderByPid-p', res)
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
</style>
