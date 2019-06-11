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
        <div class="title">{{ title }}</div>
        <div v-html="htmlDiff"></div>
      </div>
      <div class="instruction">
        <div>绿色表示与前一版本比较的新增内容</div>
        <div>红色表示与前一版本比较的删除内容</div>
        <div>紫色表示与前一版本比较后样式更新</div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import htmlDiff from '../../tools/htmlDiff'
import '../../tools/htmlDiff/style.css'

export default {
  name: 'HistoryPanel',

  data () {
    return {
      title: '111111',
      htmlFrom: `<div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div style=\"font-size: 12px; width: 100%; overflow: auto;font-family:  'Microsoft YaHei', '微软雅黑', '华文黑体',STHeiti,'Microsoft JhengHei',sans-serif;\"><table cellspacing=\"0\" cellpadding=\"0\" border=\"1\" style=\"table-layout:fixed; border-collapse:collapse; border: 1px solid #ccc; width:620px;\"><tbody><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aaa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">dd</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">dd</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aaa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">ddd</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">dd</div></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr></tbody></table></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\">测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试</div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><span style=\"font-family:SimSun,STSong;\">测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"heading\" yne-bulb-level=\"a\" id=\"9088-1550668870077\" style=\"white-space: pre-wrap;\"><span style=\"font-size:32px;font-weight:bold;\">测试测试测试测试测试测试测试测试测试测试</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\">哦哦哦哦哦哦<span style=\"text-decoration: line-through;\">测试测试测试测试测试测试测试测试测试测试测试测试测试</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><span style=\"text-decoration: line-through;\">范德萨发</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"image\" style=\"width:620;height:413;\"><img data-media-type=\"image\" src=\"https://note.youdao.com/yws/open/resource/download/1360/2A0A14591766486685BAF6884FC7F970?oauth_token=f19d5c3bd9b7587d8dc4c49f3550d352\" alt=\"\" style=\"width:620px;\"></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div>`,
      htmlTo: `<div yne-bulb-block=\"paragraph\"><br></div><div style=\"font-size: 12px; width: 100%; overflow: auto;font-family:  'Microsoft YaHei', '微软雅黑', '华文黑体',STHeiti,'Microsoft JhengHei',sans-serif;\"><table cellspacing=\"0\" cellpadding=\"0\" border=\"1\" style=\"table-layout:fixed; border-collapse:collapse; border: 1px solid #ccc; width:620px;\"><tbody><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aafewf</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aaaaaa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">dd</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">dd</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aaa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">aa</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">ddd</div></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><div class=\"table-cell-line\">dd</div></td></tr><tr><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td><td style=\"word-wrap: break-word;width: 124px;height: 40px;\"><br></td></tr></tbody></table></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\">测试测试测试测试测aojfowjf试测试测试测试测试测试测试测试测试测试测试测试测试</div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><span style=\"font-family:SimSun,STSong;\">测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"heading\" yne-bulb-level=\"a\" id=\"9088-1550668870077\" style=\"white-space: pre-wrap;\"><span style=\"font-size:32px;font-weight:bold;\">测试测试测试测试测试测试测试测试测试测试</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\">哦哦哦哦哦哦<span style=\"text-decoration: line-through;\">测试测试测试测试测试测试测试测试测试测试测试测试测试</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><span style=\"text-decoration: line-through;\">范德萨发</span></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div><div yne-bulb-block=\"image\" style=\"width:620;height:413;\"></div><div yne-bulb-block=\"paragraph\" style=\"white-space: pre-wrap;\"><br></div>`,
      htmlDiff: ''
    }
  },

  computed: {
    ...mapGetters({
      isHistoryPanelShowed: 'GET_SHOW_HISTORY_PANEL'
    })
  },

  watch: {
    isHistoryPanelShowed (val) {
      if (val) {
        this.htmlDiff = htmlDiff(this.htmlFrom, this.htmlTo)
      }
    }
  },

  created () {
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_HISTORY_PANEL'
    ]),

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

.container
  position relative
  height 95%
  overflow-y scroll
  padding 20px

.instruction
  width 100%
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
        background-color #ffcccc
    &:nth-of-type(2)
      &::before
        background-color #e0ffcc
    &:nth-of-type(3)
      &::before
        background-color #e0e5ff
</style>

