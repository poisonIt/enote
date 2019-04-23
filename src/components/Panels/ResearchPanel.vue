<template>
  <div>
    <modal
      width="480px"
      height="456px"
      top="10vh"
      transition-name="fade-in-down"
      title="研报提交"
      @close="closeResearchPanel"
      :visible.sync="isResearchPanelShowed">
      <div class="research-panel">
        <div class="form-item small">
          <div class="form-label">报告大类</div>
          <BSelect
            :width="'140px'"
            :height="'28px'"
            v-model="largeType"
            :placeholder="'报告大类'"
            ref="largeTypeSelect">
            <b-option
              v-for="(item, index) in largeTypeArr"
              :key="index"
              :label="item.name"
              :value="item.id"
              :labelProxy="'name'"
              :valueProxy="'id'"
              :children="item.children">
            </b-option>
          </BSelect>
        </div>
        <div class="form-item small">
          <div class="form-label">报告小类</div>
          <BSelect
            :width="'140px'"
            :height="'28px'"
            :disabled="smallTypeArr.length === 0"
            v-model="smallType"
            :placeholder="'报告小类'"
            ref="smallTypeSelect">
            <b-option
              v-for="(item, index) in smallTypeArr"
              :key="index"
              :label="item.name"
              :value="item.id"
              :labelProxy="'name'"
              :valueProxy="'id'"
              :children="item.children">
            </b-option>
          </BSelect>
        </div>
        <div class="form-item small">
          <div class="form-label">选择股票</div>
          <input type="text" v-model="stock">
        </div>
        <div class="form-item small">
          <div class="form-label">选择行业</div>
          <input type="text" v-model="trade">
        </div>
        <div class="form-item">
          <div class="form-label">报告标题</div>
          <textarea type="text" v-model="title"></textarea>
        </div>
        <div class="form-item">
          <div class="form-label">关键字</div>
          <textarea type="text" v-model="keywords"></textarea>
        </div>
        <div class="form-item">
          <div class="form-label">上传附件</div>
          <Upload
            multiple
            :before-upload="handleUpload"
            action="//jsonplaceholder.typicode.com/posts/"
            style="width: 85%;margin-left: 10px;padding-top: 7px;">
            <Button
              class="upload-button"
              icon="ios-cloud-upload-outline">新增文件
            </Button>
          </Upload>
        </div>
        <!-- <Loading class="loading" :type="8" fill="#DDAF59" v-if="isLoading"></Loading> -->
      </div>
      <div class="button-group" slot="footer">
          <div class="button primary">完成</div>
          <div class="button" @click="closeResearchPanel">取消</div>
        </div>
    </modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  publishShare,
  unPublishShare
} from '../../service'
import Loading from '@/components/Loading'

export default {
  name: 'ResearchPanel',

  components: {
    Loading
  },

  data () {
    return {
      isLoading: true,
      largeType: '',
      smallType: '',
      stock: '',
      trade: '',
      title: '',
      keywords: '',
      largeTypeArr: [
        {
          name: '公司研究',
          id: '100029',
          children: []
        },
        {
          name: 'QDII内部报告',
          id: '100046',
          children: []
        },
        {
          name: '行业报告',
          id: '100035',
          children: []
        }
      ],
      smallTypeArr: []
    }
  },

  computed: {
    ...mapGetters({
      isResearchPanelShowed: 'GET_SHOW_RESEARCH_PANEL',
      userInfo: 'GET_USER_INFO',
      currentFile: 'GET_CURRENT_FILE'
    })
  },

  watch: {
    isResearchPanelShowed (val) {
      if (val) {
        console.log('watch-isResearchPanelShowed', val)
        // this.createShare()
      }
    },

    userInfo (val) {
      this.fdList = val.friend_list
    },
  },

  mounted () {
    // if (this.userInfo.friend_list.length > 0) {
    //   this.selectedFd = this.userInfo.friend_list[0]
    // }
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_RESEARCH_PANEL'
    ]),

    closeResearchPanel () {
      this.TOGGLE_SHOW_RESEARCH_PANEL(false)
    },
    
    handleUpload (file) {
      console.log('handleUpload', file)
      return false
    }
  }
}
</script>

<style lang="stylus" scoped>
.lucency
  opacity 0

.research-panel
  position relative
  font-size 13px
  line-height 40px
  color #999
  padding 20px 30px 0

.form-item
  width 100%
  display flex
  flex-direction row
  align-items baseline
  .form-label
    width 52px
    text-align left
  input
    padding-left 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    &:focus
      border 1px solid #DDAF59
  textarea
    width 85%
    margin-left 9px
    padding-left 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    resize none
    &:focus
      border 1px solid #DDAF59

.form-item
  &.small
    float left
    width 48%
    margin-right 16px
    align-items center
    justify-content space-between
    &:nth-of-type(2n)
      margin-right 0
    input
      width 140px
      height 28px
  // .form-label
  //   margin-right 20px

.upload-button
  margin-left 10px
  &:hover
    color #DDAF59 !important
    border-color #DDAF59 !important

.loading
  display flex
  width 100%
  height 100%
  left 0
  top 40px
  position absolute
  /* justify-items center */
  justify-content center
  align-items center

.button-group
  width 38%
  bottom -24px
  left 77%
</style>

