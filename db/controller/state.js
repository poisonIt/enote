import * as _ from 'lodash'
import stateModel from '../models/state'
import { LinvoDB } from '../index'

let State = {}

function createCollection (path) {
  LinvoDB.dbPath = path
  State = new LinvoDB(`state`, {
    note_ver: {
      type: Number,
      default: 0
    }
  })
}

// remove
function remove () {
  return new Promise((resolve, reject) => {
    State.find({}, (err, states) => {
      states.forEach(state => {
        state.remove()
      })
      resolve(states.length)
    })
  })
}

// update
async function update (req) {
  return new Promise((resolve, reject) => {
    State.find({})
    .exec((err, states) => {
      let state = states[0]
      if (!state) {
        State.insert(stateModel(req), (err, newState) => {
          resolve(newState)
        })
      } else {
        State.update(
          { _id: state._id },
          { $set: req },
          { multi: true },
          (err, num, newState) => {
            resolve(newState)
          }
        )
      }
    })
  })
}

// get
function get () {
  return new Promise((resolve, reject) => {
    State.find({}, (err, states) => {
      if (states.length === 0) {
        State.insert(stateModel({}), (err, newState) => {
          resolve(newState)
        })
      } else {
        resolve(states[0])
      }
    })
  })
}

export default {
  createCollection,
  remove,
  update,
  get
}
