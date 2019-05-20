import * as _ from 'lodash'
import stateModel from '../models/state'
import { LinvoDB } from '../index'

let State = {}

function createCollection (path) {
  State = new LinvoDB(`state-${path}`, {
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
  console.log('update', req)
  return new Promise((resolve, reject) => {
    State.find({})
    .exec((err, states) => {
      let state = states[0]
      console.log('update-000', state)
      if (!state) {
        console.log('update-res-111111', stateModel(req))
        State.insert(stateModel(req), (err, newState) => {
          console.log('update-res-111', newState)
          resolve(newState)
        })
      } else {
        State.update(
          { _id: state._id },
          { $set: req },
          { multi: true },
          (err, num, newState) => {
            console.log('update-res-222', newState)
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
      console.log('get-res', states)
      resolve(states[0])
    })
  })
}

export default {
  createCollection,
  remove,
  update,
  get
}
