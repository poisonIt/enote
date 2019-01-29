// let eventPoolFrom = {}
let cbs = {}

export default {
  methods: {
    hookHub (eventName, from, cb) {
      // eventPoolFrom[eventName] = [from]
      if (!cbs[eventName]) {
        cbs[eventName] = {}
        this.$hub.$on(eventName, (from, params) => {
          console.log('params', from, params)
          cbs[eventName][from]()
        })
      }
      cbs[eventName][from] = cb
    },

    dispatchHub (eventName, from, params) {
      // console.log('dispatchHub', from.$options._componentTag, eventPoolFrom[eventName])
      console.log('dispatchHub', eventName, from)
      if (cbs[eventName].hasOwnProperty(from.$options._componentTag)) {
        this.$hub.$emit(eventName, from.$options._componentTag, params)
      }
    }
  }
}
