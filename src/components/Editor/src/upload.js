import store from '../../../store'
import { copyFile, existsSync, mkdir } from 'fs'
import { uploadFile } from '../../../service'
import LocalDAO from '../../../../db/api'
import { GenNonDuplicateID } from '@/utils/utils'
import { newError } from 'builder-util-runtime';
const { remote, ipcRenderer } = require('electron')
const path = require('path')

const appPath = remote.app.getAppPath('userData')
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
    return this.loader.file
    .then(file => new Promise((resolve, reject) => {
      uploadFile(file).then(res => {
        if (res.data.body && res.data.body[0]) {
          resolve({
            default: res.data.body[0].url
          })
        } else {
          throw new Error('')
        }
      }).catch(err => {
        console.log('store-111', store, store.state.files.current_file._id)
        const mimes = {
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg'
        }
  
        const ext = path.extname(file.path)
        const mime = mimes[ext]
        const newFileName = GenNonDuplicateID(6) + ext
        const dest = path.resolve(resourcePath, newFileName)
        console.log('upload-111', ext, mime, newFileName, dest)
        console.log('store-222', file.path, dest)
        copyFile(file.path, dest, (err) => {
          if (err) throw err
          console.log(`${file.name} was copied to ${dest}`)
          ipcRenderer.send('fetch-local-data', {
            tasks: ['addLocalImage'],
            params: [{
              name: newFileName,
              path: `file:///${dest}`,
              note_id: store.state.files.current_file._id,
              ext: ext,
              mime: mime
            }],
            from: 'Editor',
          })
          resolve({
            default: `file:///${dest}`
          })
        })
      })
    }))
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