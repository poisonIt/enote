import axios from 'axios'

export function authenticate (params) {
  return axios.post('/authenticate', {
    username: params.username,
    password: params.password
  })
}

export function getUserInfo () {
  return axios.get('/note/user/userInfo')
}

export function getFriendList () {
  return axios.get('/user/all')
}

export function pullNotebooks () {
  return axios.get('/noteBook/notebooks')
}

export function pullNote () {
  return axios.get('/note/pullNote')
}

export function pullTags () {
  return axios.get('/note/tag/tags')
}

export function pushNotebook (params) {
  console.log('pushNotebook', params)
  return axios.post('/noteBook/pushNotebook', params)
}

export function pushNote (params) {
  console.log('pushNote', params)
  return axios.post('/note/pushNote', params)
}

export function publishShare (params) {
  console.log('publishShare', params)
  return axios.post('/share/publish', params)
}

export function unPublishShare (params) {
  console.log('unPublishShare', params)
  // let formData = new FormData()
  // Object.keys(params).forEach(key => {
  //   formData.append(key, params[key])
  // })
  return axios.delete('/share/unPublish', {
    data: params
  })
}

export function uploadFile (file) {
  console.log('uploadFile', file)
  const data = new FormData()
  data.append('files', file)
  return axios.post('/file/upload', data)
}

export function createTag (params) {
  return axios.post('/note/createTag', params)
}

export function modifyTag (params) {
  return axios.put('/note/modifyTag', params)
}

export function deleteTag (params) {
  console.log('deleteTag', params)
  return axios.delete('/note/deleteTag', {
    data: params,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function getSync () {
  return axios.get('/youdao/sync')
}

export function syncSate () {
  return axios.get('/youdao/syncState')
}

export function getReportSubclass (params) {
  console.log('getReportSubclass', params)
  return axios.get('/report/reportSubclass', {
    params: params
  })
}

export function getReportStock (params) {
  console.log('getReportStock', params)
  return axios.get('/report/stocks', {
    params: params
  })
}

export function getReportTrade (params) {
  return axios.get('/report/trades', {
    params: params
  })
}

export function addReport (params) {
  return axios.post('/report/addReport', params)
}
