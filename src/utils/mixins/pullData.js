import { ipcRenderer } from 'electron'
import { 
  pullNotebooks,
  pullNote,
  pullTags,
  getShareWithMe
} from '@/service'
import LocalDAO from '../../../db/api'
import { mapGetters, mapActions } from 'vuex'
import fetchLocal from '../fetchLocal'
import {
  transNoteBookDataFromRemote,
  transNoteDataFromRemote,
  transTagDataFromRemote
} from './transData'

let allTagLocalMap = {}

export default {
  data () {
    return {
      pullResp: []
    }
  },

  computed: {
    ...mapGetters({
      noteVer: 'GET_NOTE_VER',
    })
  },

  methods: {
    ...mapActions([
      'SET_TOKEN',
      'SET_NOTE_VER'
    ]),

    async pullData (noteVer) {
      let allNotes = await fetchLocal('getLocalNoteByQuery', {}, { multi: true })
      // console.log('allNotes', allNotes)
      let resp = await this.runPullTasks(noteVer)
      return resp
    },

    async runPullTasks (noteVer) {
      const { clientId, deviceName, platform } = this.$remote.app.appConf
      let pullResp = await Promise.all([
        pullNotebooks(),
        pullNote({
          deviceId: clientId,
          deviceName: deviceName,
          deviceType: platform
        }),
        pullTags(),
        getShareWithMe()
      ])

      let returnMsgs = pullResp.map(item => item.data.returnMsg)

      let isSuccess = true

      for (let i = 0, len = returnMsgs.length; i < len; i++) {
        if (returnMsgs[i] !== 'success') {
          isSuccess = false
          break
        }
      }

      if (!isSuccess) {
        this.isLoading = false
        return
      }

      let tagsData = (pullResp[2].data.body || []).map(item => transTagDataFromRemote(item))
      await fetchLocal('diffAddMultiLocalTag', tagsData)
      let tagLocalResp = await fetchLocal('diffAddMultiLocalTag', tagsData)
      allTagLocalMap = {}
      tagLocalResp.forEach(item => {
        allTagLocalMap[item.remote_id] = item._id
      })

      let folderData = (pullResp[0].data.body || []).map(item => transNoteBookDataFromRemote(item))
      // console.log('111', folderData)
      await fetchLocal('diffAddMultiLocalFolder', folderData)
      // console.log('222', tagsData)

      let noteData = (pullResp[1].data.body || []).map(item => transNoteDataFromRemote(item, allTagLocalMap))
      // console.log('333', noteData)
      await fetchLocal('diffAddMultiLocalNote', noteData)

      if (noteData.length > 0) {
        let usnArr = noteData.map(item => item.usn)
        let usnMax = Math.max(...usnArr)
        if (usnMax > this.noteVer) {
          this.SET_NOTE_VER(usnMax)
          await fetchLocal('updateState', {
            note_ver: usnMax
          })
        }
      }

      let sharedNoteData = (pullResp[3].data.body || []).map(item => transNoteDataFromRemote(item))
      await fetchLocal('updateSharedNote', sharedNoteData)

      ipcRenderer.send('pull-finished')
    }
  }
}
