import user from '../controllers/user'
import tag from '../controllers/tag'
import folder from '../controllers/folder'
import note from '../controllers/note'
import doc from '../controllers/doc'
import files from '../controllers/files'
import img from '../controllers/img'

const LocalDAO = {
  user,
  tag,
  folder,
  note,
  doc,
  files,
  img
}

export default LocalDAO
