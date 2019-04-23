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
            ref="upload"
            :show-upload-list="false"
            :before-upload="handleUpload"
            :on-success="handleSuccess"
            action=""
            style="width: 85%;padding-top: 7px;">
            <Button
              class="upload-button"
              icon="ios-cloud-upload-outline">新增文件
            </Button>
          </Upload>
          <ul class="upload-list">
            <li class="upload-list-item" v-for="(item, index) in uploadList" :key="index">
              <span>{{ item.name }}</span>
              <div class="icon-del"></div>
            </li>
          </ul>
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
      uploadList: [],
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

    uploadList (val) {
      console.log('watch-uploadList', val)
    }
  },

  mounted () {
    // if (this.userInfo.friend_list.length > 0) {
    //   this.selectedFd = this.userInfo.friend_list[0]
    // }
    this.uploadList = this.$refs.upload.fileList
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
      this.uploadList.push(file)
      return true
    },

    handleSuccess (res, file) {
      console.log('handleSuccess', res, file)
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
  position relative
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
    height 46px
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

.upload-list
  position absolute
  width 85.4%
  height 100px
  right 0
  top 50px
  line-height 32px
  font-size 12px
  color #333
  overflow scroll
  .upload-list-item
    position relative

.icon-del
  position absolute
  top 50%
  right 12px
  transform translateY(-50%)
  width 24px
  height 24px
  background-image url('../../assets/images/lanhu/icon_del@2x.png')
  background-size contain
  background-position center
  background-repeat no-repeat

.button-group
  width 38%
  bottom 14px
  left 77%

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
</style>

