import user from '../controller/user'
import folder from '../controller/folder'
import note from '../controller/note'
import sharedNote from '../controller/sharedNote'
import doc from '../controller/doc'
import tag from '../controller/tag'
import img from '../controller/img'
import state from '../controller/state'
import publicNote from '../controller/publicNote'

const LocalDAO = {
  user,
  folder,
  note,
  sharedNote,
  doc,
  tag,
  img,
  state,
  publicNote
}

export default LocalDAO
