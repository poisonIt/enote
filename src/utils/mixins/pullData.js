import { 
  pullNotebooks,
  pullNote,
  pullTags
} from '@/service'
import LocalDAO from '../../../db/api'
import { mapActions } from 'vuex'

export default {
  data () {
    return {
    }
  },

  methods: {
    ...mapActions([
      'SET_TOKEN'
    ]),

    async pullData () {
      return new Promise((resolve, reject) => {
        let resp = this.runPullTasks()
        console.log('pullData-resp', resp)
        resolve(resp)
      })
    },

    async runPullTasks () {
      let pullResp = await Promise.all([
        pullNotebooks(),
        pullNote(),
        // pullTags()
      ])
      console.log('runPullTasks', pullResp)

      await LocalDAO.folder.removeAll()
      await LocalDAO.note.removeAll()
      await LocalDAO.doc.removeAll()
      // await LocalDAO.tag.removeAll()
      // await LocalDAO.files.removeAll()
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

      // if (pullResp[2].data.returnMsg !== 'success') {
      //   // alert(`获取标签：${pullResp[3].data.returnMsg}`)
      //   this.isLoading = false
      //   return
      // }

      let dataBody = pullResp[0].data.body
      const saveNoteBooksTask = dataBody
        .map(item => LocalDAO.folder.add(this.transNoteBookData(item)))

      const saveNoteTask = pullResp[1].data.body
        .map(item => {
          return LocalDAO.note.add(this.transNoteData(item)
        )})

      // const saveTagTask = (pullResp[2].data.body || [])
      //   .map(item => LocalDAO.tag.add(this.transTagData(item)))

      // let saveLocalRes = await Promise.all([...saveNoteBooksTask, ...saveNoteTask, ...saveTagTask])
      let saveLocalRes = await Promise.all([...saveNoteBooksTask, ...saveNoteTask])
      console.log('saveLocalRes', saveLocalRes)

      return saveLocalRes
    },

    transNoteBookData (obj) {
      console.log('transNoteBookData', obj.noteBookId, obj.title, obj)
      return {
        type: 'folder',
        remote_id: obj.noteBookId,
        pid: obj.parentId !== '0' ? obj.parentId : '/',
        title: obj.title || '',
        seq: obj.seq || 0,
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        trash: obj.trash,
        need_push: false
      }
    },

    transNoteData (obj) {
      console.log('transNoteData', obj.noteId, obj.title, obj)
      return {
        type: 'note',
        remote_id: obj.noteId,
        title: obj.title || '',
        create_at: new Date(obj.createDt).valueOf(),
        update_at: new Date(obj.modifyDt).valueOf(),
        pid: obj.noteBookId !== '0' ? obj.noteBookId : '/',
        trash: obj.trash,
        file_size: obj.size,
        content: obj.noteContent,
        tags: obj.tagId ? obj.tagId.filter(item => item) : [],
        need_push: false,
        top: obj.top
      }
    },

    transTagData (obj) {
      return {
        name: obj.tagName,
        remote_id: obj.tagId
      }
    }
  }
}
