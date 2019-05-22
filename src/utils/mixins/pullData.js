import { ipcRenderer } from 'electron'
import { 
  pullNotebooks,
  pullNote,
  pullTags
} from '@/service'
import LocalDAO from '../../../db/api'
import { mapGetters, mapActions } from 'vuex'

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

  created () {
    this.hookPullMsgHandler()
  },

  methods: {
    ...mapActions([
      'SET_TOKEN',
      'SET_NOTE_VER'
    ]),

    hookPullMsgHandler () {
      ipcRenderer.on('fetch-local-data-response', (event, arg) => {
        console.log('fetch-local-data-response', arg)
        if (arg.from === 'pullData') {
          console.log('pullData-res', arg)
          if (arg.tasks.indexOf('diffAddMultiLocalTag') > -1) {
            console.log('diffAddMultiLocalTag', arg.res)
            let tagResp = arg.res
            allTagLocalMap = {}
            tagResp.forEach(item => {
              allTagLocalMap[item.remote_id] = item._id
            })
            this.diffAddNoteBook(this.pullResp[0].data.body || [])
          }
          if (arg.tasks.indexOf('diffAddMultiLocalFolder') > -1) {
            console.log('diffAddMultiLocalFolder-res', arg.res)
            this.diffAddNote(this.pullResp[1].data.body)
            if (this.pullResp[1].data.body.length > 0) {
              let usnArr = this.pullResp[1].data.body.map(item => item.usn)
              let usnMax = Math.max(...usnArr)
              console.log('updateState-usnMax', usnArr, usnMax)
              if (usnMax > this.noteVer) {
                this.SET_NOTE_VER(usnMax)
                ipcRenderer.send('fetch-local-data', {
                  tasks: ['updateState'],
                  params: [{
                    note_ver: usnMax
                  }],
                  from: 'pullData'
                })
              }
            }
          }
          if (arg.tasks.indexOf('diffAddMultiLocalNote') > -1) {
            console.log('diffAddMultiLocalNote-res', arg.res)
            ipcRenderer.send('pull-finished')
          }
        }
      })
    },

    async pullData (noteVer) {
      console.log('pullData', noteVer)
      return new Promise((resolve, reject) => {
        let resp = this.runPullTasks(noteVer)
        console.log('pullData-resp', resp)
        resolve(resp)
      })
    },

    async runPullTasks (noteVer) {
      this.pullResp = await Promise.all([
        pullNotebooks(),
        pullNote({ version: noteVer }),
        pullTags()
      ])
      console.log('runPullTasks', this.pullResp)

      if (this.pullResp[0].data.returnMsg !== 'success') {
        this.isLoading = false
        return
      }

      if (this.pullResp[1].data.returnMsg !== 'success') {
        this.isLoading = false
        return
      }

      if (this.pullResp[2].data.returnMsg !== 'success') {
        this.isLoading = false
        return
      }

      this.diffAddTag(this.pullResp[2].data.body || [])
      return
    },

    diffAddTag (data) {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['diffAddMultiLocalTag'],
        params: [data.map(item => this.transTagData(item))],
        from: 'pullData'
      })
    },

    diffAddNoteBook (data) {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['diffAddMultiLocalFolder'],
        params: [data.map(item => this.transNoteBookData(item))],
        from: 'pullData'
      })
    },

    diffAddNote (data) {
      ipcRenderer.send('fetch-local-data', {
        tasks: ['diffAddMultiLocalNote'],
        params: [data.map(item => this.transNoteData(item))],
        from: 'pullData'
      })
    },

    transNoteBookData (obj) {
      console.log('transNoteBookData', obj)
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
