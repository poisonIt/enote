function broadcast (componentName, eventName, params, deep) {
  this.$children.forEach(child => {
    var name = child.$options._componentTag

    if (!deep) {
      if (name === componentName) {
        child.$emit.apply(child, [eventName].concat(params))
      } else {
        broadcast.apply(child, [componentName, eventName].concat([params]))
      }
    } else {
      let correct = true
      for (let i in params) {
        if (child[i] !== params[i]) {
          correct = false
          break
        }
      }
      if (correct) {
        child.$emit.apply(child, [eventName].concat(params))
      } else {
        broadcast.apply(child, [componentName, eventName].concat([params, true]))
      }
    }
  })
}

export default {
  methods: {
    dispatch (componentName, eventName, params) {
      var parent = this.$parent || this.$root
      var name = parent.$options._componentTag
      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent

        if (parent) {
          name = parent.$options._componentTag
        }
      }
      if (parent) {
        parent.$emit.apply(parent, [eventName].concat(params))
      }
    },

    broadcast (componentName, eventName, params, deep) {
      broadcast.call(this, componentName, eventName, params, deep)
    }
  }
}
