import user from '../controller/user'
import folder from '../controller/folder'
import note from '../controller/note'
import doc from '../controller/doc'
import tag from '../controller/tag'
import img from '../controller/img'
import state from '../controller/state'

const LocalDAO = {
  user,
  folder,
  note,
  doc,
  tag,
  img,
  state
}

export default LocalDAO
