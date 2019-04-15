import Vue from 'vue'
import Router from 'vue-router'
import { ipcRenderer } from 'electron'

import Home from '@/views/Home'
import Login from '@/views/Login'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  base: __dirname,
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login,
      // beforeEnter: (to, from, next) => {
      //   ipcRenderer.send('changeWindowSize', {width: 442, height: 490})
      //   console.log('进入主页')
      //   next()
      // }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      // beforeEnter: (to, from, next) => {
      //   ipcRenderer.send('changeWindowSize', {width: 960, height: 640})
      //   console.log('进入主页')
      //   next()
      // }
    }
  ]
})
