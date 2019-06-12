<template>
  <div>
    <modal
      width="80vw"
      height="80vh"
      transition-name="fade-in-down"
      title="历史版本比较"
      @close="closeHistoryPanel"
      :visible.sync="isHistoryPanelShowed">
      <div class="container">
        <div id="history" class="content">
          <div class="title">{{ title }}</div>
          <div v-html="htmlDiff"></div>
        </div>
        <div class="list">
          <ul>
            <li v-for="(item, index) in histories"
              :key="index"
              :class="{ active: selectedItem === item }"
              @click="handleClickItem(item)">
              <span>{{ item.updateDt }}</span>
            </li>
          </ul>
          <p class="no-history" v-if="histories.length === 0">暂无历史版本记录</p>
        </div>
      </div>
      <div class="instruction">
        <div>绿色表示与前一版本比较的新增内容</div>
        <div>红色表示与前一版本比较的删除内容</div>
        <div>紫色表示与前一版本比较后样式更新</div>
      </div>
      <div class="loading" v-if="isLoading">
        <Loading :type="1" fill="#DDAF59" style="position: absolute; top: 40%; left: 50%; transform: scale(1.5)"></Loading>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import * as _ from 'lodash'
import htmlDiff from '../../tools/htmlDiff'
import '../../tools/htmlDiff/style.css'
import { getNoteHistory } from '../../service'
import EventHub from '../../utils/eventhub'
import fetchLocal from '../../utils/fetchLocal'
import Loading from '@/components/Loading'

export default {
  name: 'HistoryPanel',

  mixins: [ EventHub ],

  components: {
    Loading
  },

  data () {
    return {
      isLoading: true,
      title: '',
      htmlFrom: '',
      htmlTo: '',
      htmlDiff: '',
      histories: [],
      selectedItem: null
    }
  },

  computed: {
    ...mapGetters({
      currentFile: 'GET_CURRENT_FILE',
      isHistoryPanelShowed: 'GET_SHOW_HISTORY_PANEL'
    })
  },

  created () {
    this.$hub.hookHub('diffHtml', 'DocumentList', (file) => this.handleDiff(file))
    this.$hub.hookHub('diffHtml', 'FileHandler', (file) => this.handleDiff(file))
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_HISTORY_PANEL'
    ]),

    handleDiff (file) {
      this.isLoading = true
      console.log('handleDiff', file)
      fetchLocal('getLocalNoteByQuery', {
        id: file.file_id || file._id
      }, {
        with_doc: true
      }).then(res => {
        if (!res.remote_id) {
          this.$Message.warning('服务器暂无此文件')
          return
        }
        this.htmlTo = res.content
        this.title = res.title
        getNoteHistory({ noteId: res.remote_id }).then(res => {
          console.log('getNoteHistory-res', res)
          if (res.data.returnCode === 200) {
            this.TOGGLE_SHOW_HISTORY_PANEL(true)
            if (!res.data.body[0]) {
              this.histories = []
              this.htmlFrom = this.htmlTo
              this.htmlDiff = htmlDiff(this.htmlFrom, this.htmlTo)
              this.isLoading = false
              return
            }
            this.histories = _.reverse(res.data.body[0].histories)
            this.selectedItem = this.histories[0]
            this.htmlFrom = this.selectedItem.noteContent
            this.htmlDiff = htmlDiff(this.htmlFrom, this.htmlTo)
            this.isLoading = false
          } else {
            this.$Message.warning('服务器暂无此文件')
          }
        })
      })
    },

    handleClickItem (item) {
      console.log('handleClickItem', item)
      this.htmlFrom = item.noteContent
      this.selectedItem = item
      this.htmlDiff = htmlDiff(this.htmlFrom, this.htmlTo)
    },

    closeHistoryPanel () {
      this.TOGGLE_SHOW_HISTORY_PANEL()
    }
  }

}
</script>

<style lang="stylus" scoped>
.title
  text-align center
  font-size 20px
  font-weight bold
  margin-bottom 10px

.loading
  width 100%
  height 100%
  position absolute
  top 0
  left 0
  background-color #fff

.container
  position relative
  height 100%
  display flex

.content
  flex 1
  height 100%
  padding 20px
  overflow-y scroll
  padding-bottom 40px

.list
  width 280px
  height 100%
  top 0
  right 0
  position relative
  background-color #fff
  border-left 1px solid #eee
  overflow-y scroll
  padding-bottom 39px
  li
    height 44px
    padding 10px 20px
    border-bottom 1px solid #eee
    &.active
      background-color #f9f9f9

.no-history
  font-size 17px
  top 30%
  width 100%
  position absolute
  text-align center

.instruction
  width 100%
  height 40px
  padding 10px 20px
  background-color #fff
  border-top 1px solid #eee
  position absolute
  bottom 0
  display flex
  flex-direction row
  align-items center
  justify-content space-between
  div
    flex .5
    display flex
    flex-direction row
    align-items center
    justify-content space-around
    &::before
      content ''
      display block
      width 10px
      height 10px
      border-radius 50%
    &:nth-of-type(1)
      &::before
        background-color #e0ffcc
    &:nth-of-type(2)
      &::before
        background-color #ffcccc
    &:nth-of-type(3)
      &::before
        background-color #e0e5ff
</style>