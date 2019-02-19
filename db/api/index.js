import files from '../controllers/files'
import doc from '../controllers/doc'
console.log('files', files)

const LocalDAO = {
  files,
  doc
}

export default LocalDAO
