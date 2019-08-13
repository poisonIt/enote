import * as _ from 'lodash'
import { promisifyAll } from '../promisify'
import { htmlToText } from '../tools'
import noteModel from '../models/note'
import folderCtr from './folder'
import docCtr from './doc'
import docTemp from '../docTemplate'
import { LinvoDB } from '../index'

let PublicFolder = {}

function createCollection (path) {
  LinvoDB.path = path
  PublicFolder = new LinvoDB(`public-folder`, {
    type: {
      type: String,
      default: 'folder'
    },
    remote_id: {
      type: String
    },
    pid: {
      type: String,
      default: '0'
    },
    remote_pid: {
      type: String
    },
    title: {
      type: String,
      default: '新建文件夹'
    },
    seq: {
      type: Number,
      default: 0
    },
    depth: {
      type: Number,
      default: 0
    },
    create_at: Date,
    update_at: Date,
    trash: {
      type: String,
      default: 'NORMAL'
    },
    need_push: {
      type: Boolean,
      default: true
    },
    tags: [String],
    top: {
      type: Boolean,
      default: false
    }
  })
  promisifyAll(PublicFolder)
}

// save
function saveAll (req) {
  const { data } = req

  return new Promise((resolve, reject) => {
    PublicFolder.save(data, (err, folders) => {
      if (err) {
        reject(err)
      }
      resolve(folders)
    })
  })
}

// add
