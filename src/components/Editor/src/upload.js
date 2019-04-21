import { uploadFile } from '../../../service'

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
      resolve({
        default: 'file:///' + this.loader.file.path
      })
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