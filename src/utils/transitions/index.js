import '../../assets/styles/transition.styl'
import CollapseTransition from './collapse-transition'

const transitions = [
  CollapseTransition
]

const install = function(Vue, opts = {}) {
  transitions.map(transition => {
    Vue.component(transition.name, transition)
  })
}

export default {
  install
}
