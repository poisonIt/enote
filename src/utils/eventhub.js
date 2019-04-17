import Vue from 'vue'

export default new Vue({
  data () {
    return {
      pool: [],
      cbs: {}
    }
  },

  watch: {
    pool (val) {
      window.onresize = () => {
        for (let i in this.pool) {
          this.pool[i]()
        }
      }
    }
  },

  methods: {
    hookHub (eventName, from, cb) {
      let { cbs } = this

      if (!cbs[eventName]) {
        cbs[eventName] = {}
        cbs[eventName][from] = [cb]
        this.$on(eventName, (from, params) => {
          cbs[eventName][from].forEach(cb => cb(params))
        })
      } else {
        if (cbs[eventName][from]) {
          cbs[eventName][from].push(cb)
        } else {
          cbs[eventName][from] = [cb]
        }
      }
    },

    dispatchHub (eventName, from, params) {
      let { cbs } = this

      if (cbs[eventName].hasOwnProperty(from.$options._componentTag)) {
        this.$emit(eventName, from.$options._componentTag, params)
      }
    }
  }
})
