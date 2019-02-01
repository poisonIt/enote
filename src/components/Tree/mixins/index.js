// import EventHubBase from '@/utils/mixins/eventhub'
import TreeEventHub from './treeEventhub'
import NodeEventHub from './nodeEventhub'

const TreeMixins = [ TreeEventHub ]
const NodeMixins = [ NodeEventHub ]

export {
  TreeMixins,
  NodeMixins
}
