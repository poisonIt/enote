import Vue from 'vue'
import Router from 'vue-router'
import { ipcRenderer } from 'electron'

import Home from '@/views/Home'
import Background from '@/views/Background'
import Login from '@/views/Login'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  base: __dirname,
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: '/background',
      name: 'Background',
      component: Background
    }
  ]
})
