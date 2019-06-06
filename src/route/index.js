import Vue from 'vue'
import Router from 'vue-router'
import { ipcRenderer } from 'electron'

import Home from '@/views/Home'
import TestGround from '@/views/TestGround'
import Login from '@/views/Login'
import Preview from '@/views/Preview'
import Pdf from '@/views/Pdf'

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
      path: '/preview',
      name: 'Preview',
      component: Preview
    },
    {
      path: '/pdf',
      name: 'PDF',
      component: Pdf
    },
    {
      path: '/test',
      name: 'TestGround',
      component: TestGround
    }
  ]
})
