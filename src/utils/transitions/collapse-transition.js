import { addClass, removeClass } from '../dom'

const Transition = {
  beforeEnter (el) {
    addClass(el, 'collapse-transition')
    el.style.height = 0
  },

  enter (el) {
    if (el.scrollHeight !== 0) {
      el.style.height = el.scrollHeight + 'px'
    } else {
      el.style.height = ''
    }
    el.style.overflow = 'hidden'
  },

  afterEnter (el) {
    el.style.height = ''
  },

  beforeLeave (el) {
    el.style.height = el.scrollHeight + 'px'
    el.style.overflow = 'hidden'
  },

  leave (el) {
    if (el.scrollHeight !== 0) {
      addClass(el, 'collapse-transition')
      el.style.height = 0
    }
  },

  afterLeave (el) {
    removeClass(el, 'collapse-transition')
    el.style.overflow = ''
    el.style.height = ''
  }
}

export default {
  name: 'CollapseTransition',
  functional: true,
  render: function (createElement, context) {
    const data = {
      on: Transition
    }
    return createElement('transition', data, context.children)
  }
}
