<template>
  <div>
    <modal
      width="400px"
      height="464px"
      transition-name="fade-in-down"
      title="移动到文件夹"
      @close="closeMovePanel"
      :visible.sync="isMovePanelShowed">
      <div style="padding: 10px 20px;">
        <Move ref="move"
          @handleMove="handleFileMoved"></Move>
      </div>
      <div class="button-group" slot="footer">
        <div class="button primary" @click="confirmMovePanel">保存</div>
        <div class="button" @click="closeMovePanel">取消</div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Move from '@/components/Move'

export default {
  name: 'MovePanel',

  components: {
    Move
  },

  data () {
    return {
    }
  },

  computed: {
    ...mapGetters({
      isMovePanelShowed: 'GET_SHOW_MOVE_PANEL'
    })
  },

  watch: {
  },

  created () {
    this.$hub.hookHub('showMovePanel', 'NavBar', (params) => this.showMovePanel(params))
    this.$hub.hookHub('showMovePanel', 'DocumentList', (params) => this.showMovePanel(params))
  },

  mounted () {
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_MOVE_PANEL'
    ]),

    showMovePanel (params) {
      let { file, tree } = params
      this.$refs.move.init(tree, file)
      this.TOGGLE_SHOW_MOVE_PANEL()
    },

    handleFileMoved (targetId) {
      this.$hub.dispatchHub('handleFileMoved', this, targetId)
      setTimeout(() => {
        // this.$refs.navbar.setCurrentFolder(id)
        this.closeMovePanel()
      }, 300)
    },

    confirmMovePanel () {
      this.$refs.move.handleMove()
    },

    closeMovePanel () {
      this.TOGGLE_SHOW_MOVE_PANEL()
      // this.$refs.move.init()
    }
  }
}
</script>
