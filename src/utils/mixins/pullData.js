import { ipcRenderer } from 'electron'
import { 
  pullNotebooks,
  pullNote,
  pullTags
} from '@/service'
import LocalDAO from '../../../db/api'
import { mapActions } from 'vuex'

let allTagLocalMap = {}

export default {
  methods: {
    ...mapActions([
      'SET_TOKEN'
    ]),

    async pullData (noteVer) {
      console.log('pullData', noteVer)
      return new Promise((resolve, reject) => {
        let resp = this.runPullTasks(noteVer)
        console.log('pullData-resp', resp)
        resolve(resp)
      })
    },

    async runPullTasks (noteVer) {
      let pullResp = await Promise.all([
        pullNotebooks(),
        pullNote({ version: noteVer }),
        pullTags()
      ])
      console.log('runPullTasks', pullResp)
      // await LocalDAO.folder.removeAll()
      // await LocalDAO.note.removeAll()
      // await LocalDAO.doc.removeAll()
      // await LocalDAO.tag.removeAll()
      console.log('runPullTasks-1111')

      if (pullResp[0].data.returnMsg !== 'success') {
        // alert(`获取笔记本：${pullResp[1].data.returnMsg}`)
        this.isLoading = false
        return
      }

      if (pullResp[1].data.returnMsg !== 'success') {
        // alert(`获取笔记：${pullResp[2].data.returnMsg}`)
        this.isLoading = false
        return
      }

      if (pullResp[2].data.returnMsg !== 'success') {
        // alert(`获取标签：${pullResp[3].data.returnMsg}`)
        this.isLoading = false
        return
      }

      let dataBody = pullResp[0].data.body

      const saveTagTask = (pullResp[2].data.body || [])
        .map(item => LocalDAO.tag.diffAdd(this.transTagData(item)))

      let tagResp = await Promise.all(saveTagTask)
      allTagLocalMap = {}
      tagResp.forEach(item => {
        allTagLocalMap[item.remote_id] = item._id
      })

      const saveNoteBooksTask = dataBody
      .map(item => LocalDAO.folder.diffAdd(this.transNoteBookData(item)))

      const saveNoteTask = pullResp[1].data.body
        .map(item => {
          return LocalDAO.note.diffAdd(this.transNoteData(item)
        )})

      if (pullResp[1].data.body[0]) {
        console.log('saveState', pullResp[1].data.body[0])
        await LocalDAO.state.update({
          note_ver: pullResp[1].data.body[0].usn
        })
      }

      let saveLocalRes = await Promise.all([...saveNoteBooksTask, ...saveNoteTask])
      console.log('saveLocalRes', saveLocalRes)

      return saveLocalRes
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
        top: obj.top
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
