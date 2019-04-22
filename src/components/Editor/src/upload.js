import { uploadFile } from '../../../service'
import store from '../../../store'

let uid = 0

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
      uploadFile(this.loader.file).then(res => {
        console.log('upload-1111', res)
        if (res.data.returnCode === 200 && res.data.body[0]) {
          resolve({
            default: res.data.body[0].url
          })
        } else {
          // console.log('store', store, store.state.files.current_file_id)
          // resolve({
          //   default: 'file:///' + this.loader.file.path
          // })
        }
      }).catch(err => {
        console.log('store-111', store, store.state.files.current_file_id)
        uid++
        resolve({
          default: `file:///${this.loader.file.path}?fileId=${store.state.files.current_file_id}&uid=${uid}`
        })
      })
    })
    
    // return new Promise ((resolve, reject) => {
    //   resolve({
    //     default: 'file:///' + this.loader.file.path
    //   })
    // })
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