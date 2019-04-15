import axios from 'axios'

const baseUrl = 'http://115.159.127.156:9090/mock/58/api'

export function authenticate (params) {
  return axios.post(baseUrl + '/authenticate', {
    username: params.username,
    password: params.password
  })
}

export function getUserInfo (token) {
  return axios.get(baseUrl + '/note/user/userInfo', {
    Authorization: token
  })
}
