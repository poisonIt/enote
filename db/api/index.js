import user from '../controller/user'
import tag from '../controllers/tag'
import folder from '../controller/folder'
import note from '../controller/note'
import doc from '../controller/doc'
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
