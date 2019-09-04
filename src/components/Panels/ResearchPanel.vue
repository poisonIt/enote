<template>
  <div>
    <modal
      width="480px"
      :height="modalHeight"
      top="8vh"
      transition-name="fade-in-down"
      title="研报提交"
      @close="closeResearchPanel"
      :visible.sync="isResearchPanelShowed"
      ref="research"
      >
      <!--  -->
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
        <div class="form-item small" v-if="largeType != 100035 && largeType != 100031">
          <div class="form-label">选择股票</div>
          <Select
            class="stock-select"
            ref="stockSelectEl"
            v-model="stock"
            :remote-method="stockMenuMethod"
            filterable
            clearable
            :loading="loadingStock"
            :placeholder="'请输入股票名称/代码'"
            remote>
            <Option
              v-for="(option, index) in stockMenuData"
              :value="option.value"
              :key="index">{{option.label}}
            </Option>
          </Select>
        </div>
        <div class="form-item small" v-if="largeType != 100031">
          <div class="form-label">选择行业</div>
          <Select
            class="stock-select"
            v-model="tradeName"
            filterable
            clearable
            remote
            v-if="largeType==100035"
            ref="tradeSelect">
            <Option
              v-for="(option, index) in tradeMenuData"
              :value="`${option.value} ${option.label}`"
              :key="index">{{option.label}}
            </Option>
          </Select>
          <input v-else type="text" v-model="tradeName" disabled="true">
        </div>
        <div class="form-item">
          <div class="form-label">报告标题</div>
          <textarea type="text"
            v-model="title"
            :class="{ error: showTitleError }"
            :maxlength="50"
            @blur="handleTitleBlur"/>
          <span class="tip-error" v-show="showTitleError">请不要超出50个中文字符长度</span>
        </div>
        <div class="form-item">
          <div class="form-label">关键字</div>
          <textarea type="text"
            v-model="keywords"
            :class="{ error: showKeywordError }"
            :maxlength="50"
            @blur="handleKeywordBlur"/>
          <span class="tip-error" v-show="showKeywordError">请不要超出50个中文字符长度</span>
        </div>

        <div class="form-item">
          <div class="form-label">上传附件</div>
          <!-- multiple -->
          <Upload
            ref="upload"
            :action="action"
            :show-upload-list="false"
            :before-upload="handleUpload"
            :on-success="handleSuccess"
            :on-progress="handleProgress"
            :data="uploadData"
            :headers="{ Authorization: 'Bearer'+authorization }"
            style="width: 85%;padding-top: 7px;">
            <Button
              class="upload-button"
              icon="ios-cloud-upload-outline">新增文件
            </Button>
          </Upload>
        </div>
        <div class="form-item" v-if="uploadList.length > 0">
          <div class="form-label"></div>
          <ul class="upload-list" ref="uploadList">
            <li class="upload-list-item" v-for="(item, index) in uploadList" :key="index">
              <span>{{ item.fileName }}</span>
              <div class="icon-del" @click="deleteFile(item)"></div>
            </li>
          </ul>
        </div>
        <div class="form-item">
          <div class="form-label"></div>
          <label class="mem-item">
            <input type="checkbox" @change="handlePublicChange">
            <div class="name">提交至“研究部晨会”</div>
          </label>
        </div>
        <div class="form-item" v-show="publicStatus">
          <div class="form-label"></div>
          <input type="text" class="public_name" v-model="researchTitle" placeholder="研究部晨会标题">
        </div>
        <!-- <div class="form-item">
          <div class="form-label">摘要</div>
          <textarea type="text"
            v-model="summary"
            :class="{ error: showSummaryError }"
            @blur="handleSummaryBlur"/>
          <span class="tip-error" v-show="showSummaryError">请不要超出50个中文字符长度</span>
        </div> -->
      </div>
      <div class="button-group" slot="footer">
        <div class="button primary" @click="postReport">完成</div>
        <div class="button" @click="closeResearchPanel">取消</div>
      </div>
    </modal>
    <!-- <modal
      :visible.sync="isAccessoryShowed"
      width="300px"
      height="210px"
      top="30vh"
      transition-name="fade-in-down"
      @close="isAccessoryShowed = false"
      title="上传附件">
        <div class="form-item isAccessory">
          <div class="form-label">上传附件</div>
          <Upload
            multiple
            ref="upload"
            :show-upload-list="false"
            :before-upload="handleUpload"
            :action="action"
            style="width: 85%;padding-top: 7px;">
            <Button
              class="upload-button"
              icon="ios-cloud-upload-outline">新增文件
            </Button>
          </Upload>
          <ul class="upload-list" ref="uploadList">
            <li class="upload-list-item" v-for="(item, index) in uploadList" :key="index">
              <span>{{ item.name }}</span>
              <div class="icon-del" @click="deleteFile(item)"></div>
            </li>
          </ul>
        </div>
        <div class="button-group button-container" slot="footer">
            <div class="button primary" @click="UploadConfirm">确认</div>
            <div class="button" @click="isAccessoryShowed = false">取消</div>
        </div>
        <Loading class="loading" :type="8" fill="#DDAF59" v-if="isLoading"></Loading>
    </modal> -->
  </div>
</template>

<script>
import * as _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  getReportStock,
  getReportTrade,
  getReportSubclass,
  addReport,
  uploadReportFile
} from '../../service'
import Loading from '@/components/Loading'
import fetchLocal from '../../utils/fetchLocal'
import { transAttachMentList } from '../../utils/mixins/transData.js'
export default {
  name: 'ResearchPanel',

  components: {
    Loading
  },

  data () {
    const validateStrLen = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please enter your password'))
      } else {
        if (value.length > 100) {
          callback(new Error('请不要超出50个中文字符长度'))
        }
        callback()
      }
    }
    return {
      noteFiles: [],
      attachmentList: [],
      attachmentflag: 0,
      researchTitle: '',
      modalHeight: '445px',
      publicStatus: false,
      isAccessoryShowed: false,
      noteId: null,
      uploadData: null,
      action: 'http://10.50.16.123:8000/api/report/uploadReportFile?reportId=0',
      isLoading: false,
      loadingStock: true,
      loadingTrade: true,
      isStockMenuVisible: false,
      largeType: '',
      smallType: '',
      stock: '',
      stockItem: null,
      trade: '',
      tradeName: '',
      titleFrom: {
        title: ''
      },
      title: '',
      showTitleError: false,
      keywords: '',
      showKeywordError: false,
      summary: '',
      showSummaryError: false,
      uploadList: [],
      query: '北',
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
        },
        {
          name: '宏观经济报告',
          id: '100031',
          children: []
        }
      ],

      smallTypeArr: [],
      stockMenuData: [],
      tradeMenuData: [],
      ruleCustom: {
        title: [
          // { required: true, message: '1111', trigger: 'blur' },
          { type: 'string', max: 20, message: 'Introduce no less than 20 words', trigger: 'blur' }
          // { validator: validateStrLen, trigger: 'blur' }
        ]
      },

    }
  },

  computed: {
    ...mapGetters({
      isResearchPanelShowed: 'GET_SHOW_RESEARCH_PANEL',
      userInfo: 'GET_USER_INFO',
      currentFile: 'GET_CURRENT_FILE',
      authorization: 'GET_TOKEN'
    })
  },

  watch: {
    isResearchPanelShowed(val) {
      if (val) {
        console.log(this.userInfo)

        this.noteId = this.currentFile.remote_id
        fetchLocal('getLocalDoc', {
          note_id: this.currentFile._id
        }).then(res => {
          this.summary = new Buffer(res.content || '').toString('base64')
        })
      }
    },
    userInfo (val) {
      this.fdList = val.friend_list
    },

    uploadList (val) {
    },

    largeType (val) {
      this.$refs.smallTypeSelect.clear()
      getReportSubclass({
        columnid: val
      }).then(resp => {
        this.smallTypeArr = resp.data.body.map(item => {
          return {
            name: item.name,
            id: item.objid,
            children: []
          }
        })
      })
      // console.log(val)
      if (val == 100035) {
        this.searchTrade()
      } else {
        this.tradeName = ''
      }
    },

    title (val, oldVal) {
      if (val.length > 100) {}
    },

    stock (val) {
      let item = _.find(this.stockMenuData, { value: val })
      if (item) {
        this.stockItem = item
        this.trade = item.trade
        this.tradeName = item.tradeName
      } else {
        this.stockItem = null
        this.trade = ''
        this.tradeName = ''
      }
    },
  },

  mounted () {
    // this.uploadList = this.$refs.upload.fileList
    this.searchTrade()
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_RESEARCH_PANEL'
    ]),

    closeResearchPanel () {
      this.$refs.largeTypeSelect.clear()
      this.$refs.smallTypeSelect.clear()
      this.stockMenuData = []
      if (this.largeType == 100035) {
        this.$refs.tradeSelect.clearSingleSelect()
        this.$refs.tradeSelect.setQuery('')
      } else if (this.largeType == 100031) {
         this.tradeName = ''
         this.stock = ''
      } else {
        this.tradeName = ''
        this.$refs.stockSelectEl.clearSingleSelect()
        this.$refs.stockSelectEl.setQuery('')
      }


      this.title = ''
      this.keywords = ''
      this.summary = ''
      this.publicStatus = false
      this.uploadList = []
      this.TOGGLE_SHOW_RESEARCH_PANEL(false)
    },

    handleUpload (file) {
      // this.uploadList.push(file)

      // this.uploadData = {
      //   reportId: 0
      // }

      let promise = new Promise((resolve) => {
        this.$nextTick(function () {
          if (this.uploadList.length > 0) {
            this.$refs.uploadList.scrollTop = 32 * (this.uploadList.length + 1)
          }
          resolve(true);
        });
      })
      return promise; //通过返回一个promis对象解决
      // this.$nextTick(() => {
      //   if (this.uploadList.length > 0) {
      //     this.$refs.uploadList.scrollTop = 32 * (this.uploadList.length + 1)
      //   }
      //   if (parseFloat(this.modalHeight) <= 535) {
      //     this.modalHeight = parseFloat(this.modalHeight) + 32 + 'px'
      //   } else {
      //     return
      //   }
      // })
      // return false
    },

    handleSuccess (resp) {
      console.log(resp)
      if (resp.returnCode === 200) {
        this.uploadList = this.uploadList.concat(resp.body)
        this.noteFiles = _.cloneDeep(this.uploadList)
        if (parseFloat(this.modalHeight) <= 535) {
          this.modalHeight = parseFloat(this.modalHeight) + 32 + 'px'
        }
      }
    },

    handleProgress (fileList) {
      console.log(fileList)
    },

    deleteFile (file) {
      let idx = this.uploadList.indexOf(file)
      this.uploadList.splice(idx, 1)

      this.noteFiles.forEach(item => {
        if (item.fileId === file.fileId) {
          item.status = 1
        }
      })

      this.$nextTick(() => {
        if (this.uploadList.length === 0) {
          this.modalHeight = '445px'
          return
        }
        if (parseFloat(this.modalHeight) >= 445 && this.$refs.uploadList.clientHeight < 80) {
          this.modalHeight = parseFloat(this.modalHeight) - 32 + 'px'
        } else {
          return
        }
      })
    },

    // UploadConfirm() {
    //   if (this.uploadList.length == 0) {
    //     this.$Message.error('未选择上传文件')
    //     return false
    //   }
    //   this.isLoading = true
    //   uploadReportFile({ files: this.uploadList, reportId: this.reportid }).then(res => {
    //     console.log(res.data)
    //     this.isLoading = false
    //     if (res.data.body.stauts == '1') {
    //       this.$Message.success('附件上传成功')
    //       this.uploadList.length = 0
    //       this.isAccessoryShowed = false
    //     } else {
    //       this.$Message.error("附件上传失败")
    //     }

    //   }).catch(err => this.$Message.error('上传失败'))
    // },

    closeStockMenu () {
      this.isStockMenuVisible = false
    },

    stockMenuMethod: _.debounce(function (query) {
      this.searchStock(query)
    }, 300),

    // tradeMenuMethod: _.debounce(function (query) {
    //   this.searchTrade(query)
    // }, 300),

    searchTrade() {
      getReportTrade().then(res => {
        console.log(res.data)
        if (res.data.returnCode === 200) {
          this.tradeMenuData = res.data.body.map(item => {
            return {
              label: item.name,
              value: item.code
            }
          })
        }
      })
    },

    searchStock (query) {
      this.loadingStock = true
      getReportStock({
        searchname: query.trim()
      }).then(resp => {
        this.loadingStock = false
        if (resp.data.returnCode === 200) {
          // console.log( resp.data.body.body)
          this.stockMenuData = resp.data.body.body.map(item => {
            return {
              value: item.scode,
              label: `${item.sname} ${item.scode}`,
              mktcode: item.mktcode,
              trade: item.industrycode,
              tradeName: item.industryname
            }
          })
        } else {
          this.stockMenuData = []
        }
      })
    },

    handleTitleBlur () {
      if (this.title.length > 100) {
        this.showTitleError = true
      } else {
        this.showTitleError = false
      }
    },

    handleKeywordBlur () {
      if (this.keywords.length > 100) {
        this.showKeywordError = true
      } else {
        this.showKeywordError = false
      }
    },

    handleSummaryBlur () {
      if (this.keywords.length > 100) {
        this.showSummaryError = true
      } else {
        this.showSummaryError = false
      }
    },
    postReport () {
      if (this.largeType==''){
        this.$Message.error('请选择报告大类')
        return
      }

      let data = {
        noteFiles: this.noteFiles,
        attachmentList: transAttachMentList(this.noteFiles),
        attachmentflag: this.attachmentflag,
        indcode: this.largeType!=100035?this.trade:this.tradeName.split(' ')[0],
        indname: this.largeType!=100035?this.tradeName:this.tradeName.split(' ')[1],
        isupdatepeandeps: 0,
        mktcode: this.stockItem == null ? '':this.stockItem.mktcode,
        reporttypeid: this.smallType,
        scode: this.stock?this.stock:'',
        scodename: this.stockItem==null ? '' : this.stockItem.label.split(' ')[0],
        status: 50,
        stype: 2,
        keywords: this.keywords,
        summary: this.summary, //摘要
        title: this.title,
        // username: this.userInfo.usercode
        username: this.userInfo.userNamePinYin,
        noteId: this.noteId,//笔记id
        syncPublic: this.publicStatus,
        isConform: false,
        title: this.researchTitle
      }

      if (data.reporttypeid === '') {
        this.$Message.error('请选择报告小类')
        return
      }
      // if (data.scode === '') {
      //   this.$Message.error('请选择股票')
      //   return
      // }
      if (data.title === '') {
        this.$Message.error('请输入报告标题')
        return
      }
      if (data.keywords === '') {
        this.$Message.error('请填写关键字')
        return
      }
      if (data.summary === '') {
        this.$Message.error('笔记不能为空')
        return
      }

      if (this.publicStatus && this.researchTitle === '') {
        this.$Message.error('研究部晨会名称不能为空')
      }

      addReport(data).then(res => {
        console.log(res)
        if (res.data.returnCode === 0) {
          this.$Message.success('提交成功')
          this.closeResearchPanel()
          // this.reportid = res.data.body.reportid
          // setTimeout(() => {
          //   this.isAccessoryShowed=true
          // }, 500)
        }
      })
    },
    handlePublicChange () {
      this.publicStatus = !this.publicStatus
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
    line-height 22px
    margin-left 9px
    padding-left 10px
    margin-bottom 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    resize none
    &:focus
      border 1px solid #DDAF59
    &.error
      border-color red

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
  // position absolute
  width 85.4%
  max-height 100px
  padding-left 10px
  // background red
  right 0
  top 50px
  line-height 32px
  font-size 12px
  color #333
  overflow-y scroll
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
  top 0px
  position absolute
  /* justify-items center */
  justify-content center
  align-items center

.stock-select
  width 140px !important
  height 28px !important
  position absolute !important
  top 6px !important
  left 63px !important
.tip-error
  position absolute
  bottom -10px
  left 64px
  color red
  font-size 12px
  line-height 18px
.isAccessory
  padding-left 30px
  padding-top 10px
.button-container
  margin-bottom 10px
  position relivate
  // bottom -35px
.ivu-select-input
    padding: 0 10px 0 8px !important

.mem-item
  display flex
  // height 50px
  flex-direction row
  justify-content space-between
  align-items center
  padding-left 10px
  &.hightlight
    background-color #FFF5E2
  .name
    // flex .8
    margin 0 10px
    font-size 12px
    color #333333
.public_name
  width: 357px
  height: 28px
  margin-left: 10px
</style>
