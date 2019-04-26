import store from '../../../store'
import { copyFile, existsSync, mkdir } from 'fs'
import { uploadFile } from '../../../service'
import LocalDAO from '../../../../db/api'
import { GenNonDuplicateID } from '@/utils/utils'
const { remote } = require('electron')
const path = require('path')

const appPath = remote.app.getAppPath('')
const resourcePath = path.resolve(appPath, '../resource/')
console.log('appPath-upload', appPath, resourcePath)

if (!existsSync(resourcePath)) {
  console.log(`${resourcePath} not exists`)
  mkdir(resourcePath, (err) => {
    if (err) throw err
  })
}

class MyUploadAdapter {
  constructor(loader) {
    // The file loader instance to use during the upload.
    this.loader = loader
  }

  // Starts the upload process.
  upload () {
    console.log('upload', this.loader)

    // return uploadFile(this.loader.file)
    return new Promise ((resolve, reject) => {
      // uploadFile(this.loader.file).then(res => {
      //   console.log('upload-1111', res)
      //   if (res.data.returnCode === 200 && res.data.body[0]) {
      //     resolve({
      //       default: res.data.body[0].url
      //     })
      //   } else {
      //     // console.log('store', store, store.state.files.current_file_id)
      //     // resolve({
      //     //   default: 'file:///' + this.loader.file.path
      //     // })
      //   }
      // }).catch(err => {
        console.log('store-111', store, store.state.files.current_file_id)
        const mimes = {
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg'
        }

        const ext = path.extname(this.loader.file.path)
        const mime = mimes[ext]
        const newFileName = GenNonDuplicateID(6) + ext
        const dest = path.resolve(resourcePath, newFileName)
        console.log('upload-111', ext, mime, newFileName, dest)

        // let brief = {}
        // for (let i in this.loader.file) {
        //   // console.log(i, this.loader.file[i])
        //   if (i === 'path') {
        //     brief[i] = dest
        //   } else if (i === 'name') {
        //     brief[i] = newFileName
        //   } else {
        //     brief[i] = this.loader.file[i]
        //   }
        // }
        console.log('store-222', this.loader.file.path, dest)
        copyFile(this.loader.file.path, dest, (err) => {
          if (err) throw err
          console.log(`${this.loader.file.name} was copied to ${dest}`)
          LocalDAO.img.add({
            name: newFileName,
            path: `file:///${dest}`,
            doc_id: store.state.files.current_file_id,
            ext: ext,
            mime: mime
          })
          resolve({
            default: `file:///${dest}`
          })
        })
      // })
    })
  }

  // Aborts the upload process.
  abort() {
    // Reject the promise returned from the upload() method.
    // server.abortUpload()
  }
}

export default function uploadAdapter(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = function (loader) {
    console.log('FileRepository', loader)
    return new MyUploadAdapter(loader)
    // ...
  }
}