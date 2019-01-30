let cbs = {}

export default {
  methods: {
    hookHub (eventName, from, cb) {
      if (!cbs[eventName]) {
        cbs[eventName] = {}
        cbs[eventName][from] = [cb]
        this.$hub.$on(eventName, (from, params) => {
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
      if (cbs[eventName].hasOwnProperty(from.$options._componentTag)) {
        this.$hub.$emit(eventName, from.$options._componentTag, params)
      }
    }
  }
}
