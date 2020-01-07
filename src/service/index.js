import axios from 'axios'

export function authenticate (params) {
  return axios.post('/authenticate', {
    username: params.username,
    password: params.password
  })
}

export function validateToken () {
  return axios.get('/jwt/validateToken')
}

export function getUserInfo () {
  return axios.get('/user/userInfo')
}

export function getFriendList () {
  return axios.get('/user/all')
}

export function getShareWithMe () {
  return axios.get('/share/withme')
}

export function pullNotebooks (params) {
  return axios.get('/noteBook/notebooks', {
    params: params
  })
}

export function pullNote (params) {
  return axios.get('/note/pullNote', {
    params: params
  })
}

export function pullTags (params) {
  return axios.get('/note/tag/tags', {
    params: params
  })
}

export function getNoteHistory (params) {
  return axios.get(`/note/noteHistory/${params.noteId}`)
}

export function pushNotebook (params) {
  return axios.post('/noteBook/pushNotebook', params)
}

export function pushNote (params) {
  return axios.post('/note/pushNote', params)
}

export function publishShare (params) {
  return axios.post('/share/publish', params)
}

export function unPublishShare (params) {
  return axios.delete('/share/unPublish', {
    data: params
  })
}

export function getShareInfo (noteId) {
  return axios.get('/share/' + noteId)
}

export function uploadFile (file) {
  const data = new FormData()
  data.append('files', file)
  return axios.post('/file/upload', data)
}

export function uploadReportFile (params) {
  const { files, reportId } = params
  const data = new FormData()
  files.forEach(file => {
    data.append('files', file)
  })
  // data.append('reportId', reportId)
  return axios.post(`/report/uploadReportFile?reportId=${reportId}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function createTag (params) {
  return axios.post('/note/createTag', params)
}

export function modifyTag (params) {
  return axios.put('/note/modifyTag', params)
}

export function deleteTag (params) {
  return axios.delete('/note/deleteTag', {
    data: params,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function getSync (params) {
  return axios.get('/youdao/sync', {
    params: params
  })
}

export function syncSate () {
  return axios.get('/youdao/syncState')
}

//
export function getReportSubclass (params) {
  return axios.get('/report/reportSubclass', {
    params: params
  })
}

// export function getReportStock (params) {
//   return axios.get('/report/stocks', {
//     params: params
//   })
// }

export function getReportTrade (params) {
  return axios.get('/report/trades', {
    params: params
  })
}

export function addReport (params) {
  return axios.post('/report/addReport', params)
}

export function uploadAccessory (data) {
  return axios.post('/report/uploadReportFile', data)
}

export function getPublicNote (params) {
  const { page, size } = params
  return axios.post(`/public/note/pull?page=${page}&size=${size}`)
}

export function saveShareWithMe (fileId) {
  return axios.post(`/public/note/saveAsMyShareNote?publicNoteId=${fileId}`)
}

export function delPublicNote (params) {
  return axios.delete(`/public/note/del`, {
    data: params,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export function saveYoudaoShare (params) {
  return axios.post('/share/save/youdao/v2', params)
}

export function reportIsRepeat (params) {
  return axios.post('/report/reportIsrepeat', params)
}

// 研报改造接口

// 初始报告大类和对应销类
export function getReportType () {
  return axios.post('/newReport/getReportType')
}
// 获取该报告需要上传的字段
export function getReportTypeFiled (typeId) {
  return axios.post(`/newReport/getReportTypeFiled?typeId=${typeId}`)
}

// 股票搜索
export function getReportStock (params) {
  return axios.post(`/newReport/indicator/index/query-stock`, params)
}

// 获取行业
export function getReportIndustry () {
  return axios.post('/newReport/indicator/index/query-industry')
}

// 获取股票带出的字段
export function getLastStockExpectProfit (stockCode) {
  return axios.post(`/newReport/report/getLastStockExpectProfit?stockCode=${stockCode}`)
}

// 盈利预测数据
export function getProfitItem (data) {
  return axios.post('/newReport/report/getProfitItem', data)
}

// 获取行业评级
export function getEnumByCode (code) {
  return axios.post(`/newReport/report/getEnumByCode?code=${code}`)
}

// 报告上传
export function insertReport (data) {
  return axios.post('/newReport/report/insertReport', data)
}
