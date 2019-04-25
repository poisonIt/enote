import Emitter from '@/utils/mixins/emitter'
import EventHubBase from '../../../utils/eventhub'
import EventHub from './eventhub'

export default [
  Emitter,
  EventHubBase,
  EventHub
]
