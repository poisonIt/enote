import { ipcRenderer } from 'electron'
import { 
  pullNotebooks,
  pullNote,
  pullTags
} from '@/service'
import LocalDAO from '../../../db/api'
import { mapGetters, mapActions } from 'vuex'
import fetchLocal from '../fetchLocal'

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
      let resp = await this.runPullTasks(noteVer)
      return resp
    },

    async runPullTasks (noteVer) {
      let pullResp = await Promise.all([
        pullNotebooks(),
        pullNote({ version: noteVer }),
        pullTags()
      ])

      let returnMsgs = pullResp.map(item => item.data.returnMsg)

      if (returnMsgs !== ['success', 'success', 'success']) {
        this.isLoading = false
        return
      }

      let tagsData = (pullResp[2].data.body || []).map(item => this.transTagData(item))
      let tagLocalResp = await fetchLocal('diffAddMultiLocalTag', tagsData)
      allTagLocalMap = {}
      tagLocalResp.forEach(item => {
        allTagLocalMap[item.remote_id] = item._id
      })

      let folderData = (pullResp[0].data.body || []).map(item => this.transNoteBookData(item))
      await fetchLocal('diffAddMultiLocalFolder', folderData)

      let noteData = (pullResp[1].data.body || []).map(item => this.transNoteData(item))
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

      ipcRenderer.send('pull-finished')
    },

    transNoteBookData (obj) {
      let pid = obj.parentId
      return {
        type: 'folder',
        remote_id: obj.noteBookId,
        // pid: pid,f
        remote_pid: pid,
        title: obj.title || '',
        seq: obj.seq || 0,
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        trash: obj.trash,
        need_push: false
      }
    },

    transNoteData (obj) {
      return {
        type: 'note',
        remote_id: obj.noteId,
        title: obj.title || '',
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        // pid: obj.noteBookId,
        remote_pid: obj.noteBookId,
        trash: obj.trash,
        file_size: obj.size,
        content: obj.noteContent,
        tags: obj.tagId ? obj.tagId.map(item => allTagLocalMap[item]) : [],
        need_push: false,
        top: obj.top,
        share: obj.share,
        usn: obj.usn
      }
    },

    transTagData (obj) {
      return {
        name: obj.tagName,
        remote_id: obj.tagId,
        need_push: false
      }
    }
  }
}
