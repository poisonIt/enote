<template>
  <div>
    <modal
      width="791px"
      top="10vh"
      :height="modalHeight"
      transition-name="fade-in-down"
      title="研报提交"
      @close="closeResearchPanel"
      :visible.sync="isResearchPanelShowed"
      ref="research">
      <div class="research-panel">
        <!-- 报告大类 -->
        <div class="report">
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
            <div class="form-label right-label">报告小类</div>
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
        </div>
        <!-- 报告标题 -->
        <div class="report">
          <div class="form-item report_title">
            <div class="form-label">报告标题</div>
            <input type="text"
              v-model="title"
              :class="{ error: showTitleError }"
              :maxlength="50"
              @blur="handleTitleBlur"/>
            <span class="tip-error" v-show="showTitleError">请不要超出50个中文字符长度</span>
          </div>
        </div>
        <!-- 作者、行业、股票  -->
        <div class="report">
          <div class="form-item small">
            <div class="form-label">作者</div>
            <input type="text"
              v-model="userInfo.username"
              disabled="true"/>
          </div>
          <!--  v-if="largeType != 100035 && largeType != 100031" -->
          <div class="form-item small" v-if="isShowFiled.indexOf('3') > -1">
            <div class="form-label right-label">股票</div>
            <Select
              class="stock-select"
              v-model="stock"
              :remote-method="stockMenuMethod"
              filterable
              placeholder="输入股票名称"
              :loading="loadingStock"
              :clearable="clearable"
              ref="stockSelectEl"
              remote>
              <Option
                v-for="(option, index) in stockMenuData"
                :value="option.value"
                :key="index">{{option.label}}</Option>
            </Select>
          </div>
          <div class="form-item small" v-if="isShowFiled.indexOf('2') > -1">
            <div class="form-label right-label">行业</div>
            <!--   -->
            <Select
              class="stock-select"
              v-model="tradeName"
              v-if="industryName === null"
              ref="tradeSelect"
              :placeholder="'请选择'">
              <OptionGroup
                v-for='(item, index) in tradeMenuData'
                :key="index"
                :label="item.firstIndustryName">
                  <Option
                    v-for="(child, c_index) in item.secondIndustryList"
                    :value="child.industryName"
                    :key="c_index">{{ child.industryName }}</Option>
              </OptionGroup>
            </Select>
            <input v-else disabled type="text" v-model="industryName"/>
          </div>
        </div>
        <!-- 股票stock -->
        <div class="report">
          <div class="form-item small" v-if="isShowFiled.indexOf('4') > -1">
            <div class="form-label">股票评级</div>
            <BSelect
              :width="'140px'"
              :height="'28px'"
              v-model="stockRating"
              :placeholder="'请选择'"
              ref="stockRatingSelect">
              <b-option
                v-for="(item, index) in gradeArray"
                :key="index"
                :label="item.label"
                :value="(item.value).toString()"
                :labelProxy="'label'"
                :valueProxy="'value'"
                :children="item.children">
              </b-option>
            </BSelect>
          </div>
          <div class="form-item small"  v-if="isShowFiled.indexOf('6') > -1">
            <div class="form-label">行业评级</div>
            <BSelect
              :width="'140px'"
              :height="'28px'"
              v-model="stockRating"
              :placeholder="'请选择'"
              ref="stockRatingSelect">
              <b-option
                v-for="(item, index) in gradeArray"
                :key="index"
                :label="item.label"
                :value="(item.value).toString()"
                :labelProxy="'label'"
                :valueProxy="'value'"
                :children="item.children">
              </b-option>
            </BSelect>
          </div>
          <div class="form-item small" v-if="isShowFiled.indexOf('4') > -1">
            <div class="form-label right-label">上次投资评级</div>
            <input type="text" v-model="investMarkName" disabled="true"/>
          </div>
        </div>
        <!-- Target price -->
        <div class="report">
          <div class="form-item small sixMonthPrice" v-if="isShowFiled.indexOf('5')>-1">
            <div class="form-label">6月目标价</div>
            <input type="text" v-if="stock === '' || stock === undefined" />
            <Input v-else v-model="sixMonthPrice1" style="width: 140px; height: 28px;">
              <span slot="append">{{unitPrice}}</span>
            </Input>
          </div>
          <div class="form-item small" v-if="isShowFiled.indexOf('5')>-1">
            <div class="form-label right-label">上次6月目标价</div>
            <input type="text" v-model="sixMonthPrice" disabled="true"/>

          </div>
          <div>
            <div class="form-item small"  v-if="isShowFiled.indexOf('7')>-1">
              <div class="form-label right-label">盈利预测币种</div>
              <input v-if="currency!==null" v-model="currency" disabled type="text"/>
              <BSelect
                v-else
                :width="'140px'"
                :height="'28px'"
                v-model="currencyName"
                :placeholder="'请选择'"
                ref="currencySelect">
                <b-option
                  v-for="(item, index) in [{ name: 'CNY', id: 1 }, { name: 'HKD', id: 2 }, { name: 'USD', id: 3}]"
                  :key="index"
                  :label="item.name"
                  :value="(item.id).toString()"
                  :labelProxy="'name'"
                  :valueProxy="'id'"
                  :children="item.children">
                </b-option>
              </BSelect>
            </div>
          </div>
        </div>
        <!-- 上传附件 -->
        <div class="report" v-if="isShowFiled.indexOf('8')>-1">
          <div class="form-item small">
            <div class="form-label">上传附件</div>
            <Upload
              ref="upload"
              :show-upload-list="false"
              :action="action"
              :before-upload="handleUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              :data="uploadData"
              :headers="{ Authorization: 'Bearer'+authorization }">
              <Button
                class="upload-button"
                icon="md-add">新增文件
              </Button>
            </Upload>
          </div>
        </div>
        <div class="report">
          <div class="form-item">
            <div class="form-label"></div>
            <ul class="upload-list" ref="uploadList">
              <li
                class="upload-list-item"
                v-for="(item, index) of uploadList"
                :key="index">
                <span><span class="file-img"></span>{{item.name}}</span>
                <div class="icon-del" @click="deleteFile(item)"></div>
                <Progress
                  v-if="item.showProgress"
                  :stroke-width="2"
                  width="100%"
                  :stroke-color="strokeColor"
                  hide-info
                  :percent="item.percentage"></Progress>
              </li>
            </ul>
          </div>
        </div>
        <div class="report" v-if="isShowFiled.indexOf('7')>-1">
          <div class="form-item small">
            <div class="form-label">盈利预测数据</div>
            <Button
              @click="handleAddProject"
              class="upload-button"
              icon="md-add">添加项目
            </Button>
          </div>
        </div>
        <!-- 添加项目 -->
        <div class="report" v-if="showProfitData">
          <div class="project">
            <Table
             height="164"
             :columns="columns"
             :data="projectData"
             :span-method="handleSpan"
             :row-class-name="rowClassName"></Table>
          </div>
        </div>

        <div class="report">
          <label class="mem-item">
            <input type="checkbox" v-model="publicStatus">
            <div class="name">提交至“研究部晨会”</div>
          </label>
        </div>
      </div>

      <div class="button-group report-button" slot="footer">
        <div class="button primary" @click="postReport">完成</div>
        <div class="button" @click="closeResearchPanel">取消</div>
      </div>
    </modal>


    <modal
      width="350px"
      height="180px"
      top="20vh"
      transition-name="fade-in-down"
      title="标题重复"
      :visible.sync="isResearchTitleShowed"
      ref="research"
    >
      <div class="researchTitle">
        研究部晨会里已有标题 ”{{ researchTitle }}“ ,确认替换吗？
      </div>

      <div class="button-group" slot="footer">
        <div class="button primary" @click="confirmPostTitle">提交</div>
        <div class="button" style="margin-left: 20px;" @click="noPostTitle">取消</div>
      </div>
    </modal>

    <modal
      width="350px"
      height="180px"
      top="20vh"
      transition-name="fade-in-down"
      title="提示"
      :visible.sync="isNotesyncAnswerShowed"
      ref="research"
    >
      <div class="researchTitle">
        该笔记在研究部晨会里已存在，是否替换？
      </div>

      <div class="button-group" slot="footer">
        <div class="button primary" @click="confirmSyncAnswer">是</div>
        <div class="button" style="margin-left: 20px;" @click="noSyncAnswer">否</div>
      </div>
    </modal>

    <modal
      width="350px"
      height="180px"
      top="20vh"
      transition-name="fade-in-down"
      title="提示"
      :visible.sync="isbackAnswerShowed"
      ref="research"
    >
      <div class="researchTitle">
        该研究部晨会标题已存在，请重新输入标题。
      </div>

      <div class="button-group" slot="footer">
        <div class="button primary" @click="backSyncAnswer">确认</div>
        <!-- <div class="button" @click="noSyncAnswer">否</div> -->
      </div>
    </modal>

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
  uploadReportFile,
  reportIsRepeat,
  getReportType,
  getReportTypeFiled,
  getReportIndustry,
  getLastStockExpectProfit,
  getProfitItem,
  getEnumByCode,
  insertReport
} from '../../service'
import Loading from '@/components/Loading'
import fetchLocal from '../../utils/fetchLocal'
import { transAttachMentList } from '../../utils/mixins/transData.js'

const list_array = [
  { label: '1', value: 'PE', disabled: false },
  { label: '2', value: 'PS' , disabled: false},
  { label: '3', value: 'PB', disabled: false },
  { label: '4', value: 'PEV', disabled: false},
  { label: '5', value: 'EV/EBITDA', disabled: false },
  { label: '6', value: 'PFCF', disabled: false }
]
let valutionYears
export default {
  name: 'ResearchPanel',

  components: {
    Loading,
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
      post_data: {
        noteId: '',
        publicTitle: '',
        syncAnswer: null,
        titleRepeatAnswer: null
      },
      addProject: false, //添加项目
      isShowFiled:['1','2','3','4','5','7','8'],
      enumCodeArr: [],
      industryName: null,
      investMarkName: '',
      stockRating: '',
      sixMonthPrice: '',
      currency: null,
      currencyName: '',
      sixMonthPrice1:'',
      unitPrice:'',
      gradeArray: [],
      clearable:true,
      strokeColor: '#1890FF',
      showProfitData: false,
      isResearchTitleShowed: false,
      isNotesyncAnswerShowed: false,
      isbackAnswerShowed: false,
      confirmResearchData: [],
      noteFiles: [],
      attachmentList: [],
      attachmentflag: 0,
      researchTitle: '',
      modalHeight: '445px',
      publicStatus: false,
      isAccessoryShowed: false,
      noteId: null,
      uploadData: null,
      action: 'http://10.50.16.123:8000/api/newReport/report/uploadReportAsFile',
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
      largeTypeName: '',
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
      iconDel: require('../../assets/images/lanhu/delete-icon@3.png'),
      largeTypeArr: [],
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
      itemTitle: '',
      columns: [],
      projectData: [],
    }
  },

  computed: {
    ...mapGetters({
      isResearchPanelShowed: 'GET_SHOW_RESEARCH_PANEL',
      userInfo: 'GET_USER_INFO',
      currentFile: 'GET_CURRENT_FILE',
      authorization: 'GET_TOKEN',
      isSyncing: 'GET_IS_SYNCING',
    }),
  },

  watch: {
    publicStatus(val) {
      if (val) {
        this.researchTitle = this.currentFile.title
        this.post_data = {
          noteId: this.currentFile.remote_id,
          publicTitle: this.currentFile.title,
          syncAnswer: null,
          titleRepeatAnswer: null
        }
      } else {
        this.researchTitle = ''
      }
    },

    isResearchPanelShowed(val) {
      if (val) {
        this.noteId = this.currentFile.remote_id
        this.title = this.currentFile.title
        this.uploadList = this.$refs.upload.fileList
        fetchLocal('getLocalDoc', {
          note_id: this.currentFile._id
        }).then(res => {
          this.summary = new Buffer(res.content || '').toString('base64')
          // console.log(this.summary)
        })

        this.handleGetReportType()
      }
    },
    userInfo (val) {
      this.fdList = val.friend_list
    },

    uploadList (val) {
    },

    largeType: {
      handler: function (newVal, oldVal) {
        console.log(newVal, oldVal)

        this.$refs.smallTypeSelect.clear()
        this.stock = ''

        this.reportType.forEach(item => {
          if (newVal == (item.id).toString()) {
            this.smallTypeArr = item.children.map(child => {
              return {
                name: child.typeName,
                id: (child.id).toString(),
                children: []
              }
            })
            if (item.typeName === '公司研究') {
              this.getEnumByCode(18)
              this.largeTypeName = item.typeName
            } else if (item.typeName === "行业报告") {
              this.getEnumByCode(19)
              this.industryName = null
              this.largeTypeName = item.typeName
              getReportIndustry().then(res => {
                if (res.data.returnCode === 200) {
                  this.tradeMenuData = res.data.data
                }
              })
            } else {
              this.largeTypeName = ''
            }
          }
        })
      },
      immediate: true,
      deep: true
    },
    smallType (val) {
      this.enumCodeArr = []
      getReportTypeFiled(Number(val)).then(resp => {
        if (resp.data.returnCode === 200) {
          resp.data.data.forEach(item => {
            this.enumCodeArr.push(item.enumCode)
            this.isShowFiled = this.enumCodeArr
          })
        }
      })
    },

    title (val, oldVal) {
      if (val.length > 100) {}
    },

    stock (newVal, oldVal) {
      valutionYears = []
      this.projectData = []
      this.countData = []
      this.stockRating = ''
      this.showProfitData = false
      this.modalHeight = '445px'
      getLastStockExpectProfit(newVal).then(resp => {
        if (resp.data.returnCode === 200) {
          this.industryName = resp.data.data.industryName
          this.industryCode = resp.data.data.industryCode
          this.investMarkName = resp.data.data.investMarkName
          this.currency = resp.data.data.currency === 1 ?  'CNY' : resp.data.data.currency === 2 ? 'HKD': resp.data.data.currency === 3 ? 'USD' : null
          this.sixMonthPrice = resp.data.data.sixMonthPrice
          console.log('盈利预测数据', resp.data.data.valutionYears )
          valutionYears = resp.data.data.valutionYears
          if (resp.data.data.valutionItems !== null && resp.data.data.valutionItems.length > 0) {
            this.showProfitData = true
            this.modalHeight = '646px'

            this.countData = resp.data.data.valutionItems
            resp.data.data.valutionItems.forEach((item, index) => {
              item.data.forEach((child, index1) => {
                child['itemLength'] = item.data.length
                child['itemIndex'] = index
                child['itemTitle'] = item.itemTitle
              })
              this.projectData = this.projectData.concat(item.data)
            })
          }
          if(resp.data.data.industryName === null) {
            getReportIndustry().then(res => {
              if (res.data.returnCode === 200) {
                this.tradeMenuData = res.data.data
              }
            })
          }
        }
      })

      if( (newVal !== '' && newVal !== undefined)) {
        let stockArr = newVal.split('.')
        let stockArrPrice = stockArr[stockArr.length - 1]
        if (stockArrPrice === 'HK') {
          return this.unitPrice = 'HKD'
        } else if (stockArrPrice === 'SZ' || stockArrPrice === 'SH' || stockArrPrice === 'TW') {
          return this.unitPrice = 'CNY'
        } else {
          return this.unitPrice = 'USD'
        }
      }
    },

    showProfitData(val) {
      if (val) {
        this.countData.forEach((item) => {
          list_array.forEach(option => {
            if (item.itemTitle === option.value) {
              option.disabled = true
            }
          })
        })
        this.columns = [{
          title: '预测项目', width: 170,align: 'center',
          render: (h, params) => {

            return h('Select', {
              props: {
                value: params.row.itemTitle==='PE'?'1':params.row.itemTitle==='PS'?'2':params.row.itemTitle==='PB'?'3':params.row.itemTitle==='PEV'?'4':params.row.itemTitle==='EV/EBITDA'?'5':'6'
              },
              style: {
                width: '140px'
              },
              on: {
                'on-change':(val) => {
                  console.log(val)
                  console.log(params)
                  let data = {
                    currency: this.currency !== null ? (this.currency === 'CNY' ? '1' : this.currency === 'HKD' ?'2' : '3') : this.currencyName,
                    method: val,
                    stockCode: this.stock
                  }
                  this.projectData = []
                  getProfitItem(data).then(resp => {
                    if (resp.data.returnCode === 200) {
                      if (resp.data.data.valutionItems !== null) {
                        console.log(resp.data.data.valutionItems)
                        this.countData[params.index] = resp.data.data.valutionItems[0]
                        console.log()
                        this.countData.forEach((item, index) => {
                          item.data.forEach((child, index1) => {
                            child['itemLength'] = item.data.length
                            child['itemIndex'] = index
                            child['itemTitle'] = item.itemTitle
                          })
                          list_array.forEach(option => {
                            if (item.itemTitle === option.value) {
                              option.disabled = true
                            }
                          })
                          this.projectData = this.projectData.concat(item.data)
                        })
                        console.log()
                      }
                    }
                  })
                }
              }
            },
            list_array.map((item, key) => {
              return h('Option', {
                style: {

                },
                props: {
                  value: item.label,
                  label: item.value,
                  disabled: item.disabled
                }
              })
            }))
          }
        },
        {
          title: '币种CNY',
          width: 126 ,
          align: 'center',
          ellipsis: true,
          render: (h, params) => {
            return h('div', {}, params.row.fieldTitle)
          }
        },
        { width: 97 ,align: 'left',
          renderHeader: (h, params) => {
            return h('div', {
              style: {
                textAlign: 'left'
              }
            }, valutionYears[valutionYears.length - 4])
          },
          render: (h, params) => {
            if (params.row.fieldIndex === "interestDebt") {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.pre,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      console.log(val)
                      this.projectData[params.index].pre = val
                      this.countData.forEach((item, index) => {

                        if (item.itemTitle === params.row.itemTitle) {
                          if(item.data[2].pre !== "" && item.data[2].pre !== "/") {
                            item.data[item.data.length - 2].pre = Number(val) + Number(item.data[2].pre)
                          }
                          if(item.data[item.data.length - 2].pre !== "" && item.data[item.data.length - 2].pre !== "/" &&  item.data[0].pre !== "" && item.data[0].pre !== "/") {
                            item.data[item.data.length - 1].pre = Number(item.data[item.data.length - 2].pre) / Number(item.data[0].pre)
                            item.data[item.data.length - 1].pre = (item.data[item.data.length - 1].pre).toFixed(2)
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else {
              return h('div', {},params.row.pre !== "" ? params.row.pre : '/')
            }

          }
        },
        { width: 100 ,align: 'left',
          renderHeader: (h, params) => {
            return h('div', {
              style: {
                textAlign: 'left'
              }
            }, valutionYears[valutionYears.length - 3])
          },
          render: (h, params) => {
            if (this.handleRowSpan(params.index)) {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.current,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      // EV/EBITDA 除外所有规则
                      this.countData.forEach((item, index) => {
                        if (item.itemTitle === params.row.itemTitle) {
                          // console.log(3, (item.data[0].pre))
                          this.projectData[params.index].current = val

                          if(item.data[0].pre !== "") {
                            item.data[1].current = (Number(val) - Number((item.data[0].pre))) / (item.data[0].pre)
                            item.data[1].current = `${(item.data[1].current * 100).toFixed(2)}%`
                          }

                          if(item.data[item.data.length - 2].current !== "" && item.data[item.data.length - 2].current !== "/") {
                            item.data[item.data.length - 1].current = Number(item.data[item.data.length - 2].current) / Number(val)
                            item.data[item.data.length - 1].current = `${(item.data[item.data.length - 1].current).toFixed(2)}`
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else if (params.row.fieldIndex === "interestDebt") {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.current,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      // EV/EBITDA 规则
                      this.projectData[params.index].current = val
                      this.countData.forEach((item, index) => {

                        if (item.itemTitle === params.row.itemTitle) {
                          if(item.data[2].current !== "" && item.data[2].current !== "/") {
                            item.data[item.data.length - 2].current = Number(val) + Number(item.data[2].current)
                          }
                          if(item.data[item.data.length - 2].current !== "" && item.data[item.data.length - 2].current !== "/" &&  item.data[0].current !== "" && item.data[0].current !== "/") {
                            item.data[item.data.length - 1].current = Number(item.data[item.data.length - 2].current) / Number(item.data[0].current)
                            item.data[item.data.length - 1].current = (item.data[item.data.length - 1].current).toFixed(2)
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else {
              return h('div', {}, params.row.current !== "" ? params.row.current : '/')
            }
          }
        },
        { key: 'oneNext', width: 105,align: 'left',
          renderHeader: (h, params) => {
            return h('div', {
              style: {
                textAlign: 'left'
              }
            }, valutionYears[valutionYears.length - 2])
          },
          render: (h, params) => {
            if (this.handleRowSpan(params.index)) {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.oneNext,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      // EV/EBITDA 除外所有规则
                      this.projectData[params.index].oneNext = val

                      this.countData.forEach((item, index) => {
                        if (item.itemTitle === params.row.itemTitle) {
                          if(item.data[0].current !== "") {
                            item.data[1].oneNext = (Number(val) - Number((item.data[0].current))) / (item.data[0].current)
                            item.data[1].oneNext = `${(item.data[1].oneNext * 100).toFixed(2)}%`
                          }

                          if(item.data[item.data.length - 2].oneNext !== "" && item.data[item.data.length - 2].oneNext !== "/") {
                            item.data[item.data.length - 1].oneNext = Number(item.data[item.data.length - 2].oneNext) / Number(val)
                            item.data[item.data.length - 1].oneNext = `${(item.data[item.data.length - 1].oneNext).toFixed(2)}`
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else if (params.row.fieldIndex === "interestDebt") {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.oneNext,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      this.projectData[params.index].oneNext = val
                      this.countData.forEach((item, index) => {

                        if (item.itemTitle === params.row.itemTitle) {
                          if(item.data[2].oneNext !== "" && item.data[2].oneNext !== "/") {
                            item.data[item.data.length - 2].oneNext = Number(val) + Number(item.data[2].oneNext)
                          }
                          if(item.data[item.data.length - 2].oneNext !== "" && item.data[item.data.length - 2].oneNext !== "/" &&  item.data[0].oneNext !== "" && item.data[0].oneNext !== "/") {
                            item.data[item.data.length - 1].oneNext = Number(item.data[item.data.length - 2].oneNext) / Number(item.data[0].oneNext)
                            item.data[item.data.length - 1].oneNext = (item.data[item.data.length - 1].oneNext).toFixed(2)
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else {
              return h('div', {}, params.row.oneNext !== "" ?  params.row.oneNext : '/' )
            }
          }
        },
        { width: 90 ,align: 'left',
          renderHeader: (h, params, title) => {
            return h('div', {
              style: {
                textAlign: 'left'
              }
            }, valutionYears[valutionYears.length - 1])
          },
          render: (h, params) => {
            if (this.handleRowSpan(params.index)) {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.twoNext,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      console.log(val)
                      // EV/EBITDA 除外所有规则
                      this.projectData[params.index].twoNext = val
                      this.countData.forEach((item, index) => {
                        if (item.itemTitle === params.row.itemTitle) {
                          if(item.data[0].oneNext !== "") {
                            item.data[1].twoNext = (Number(val) - Number((item.data[0].oneNext))) / (item.data[0].oneNext)
                            item.data[1].twoNext = `${(item.data[1].twoNext * 100).toFixed(2)}%`
                          }

                          if(item.data[item.data.length - 2].twoNext !== "" && item.data[item.data.length - 2].twoNext !== "/") {
                            item.data[item.data.length - 1].twoNext = Number(item.data[item.data.length - 2].twoNext) / Number(val)
                            item.data[item.data.length - 1].twoNext = `${(item.data[item.data.length - 1].twoNext).toFixed(2)}`
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else if (params.row.fieldIndex === "interestDebt") {
              return h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center'
                }
              }, [
                h('Input', {
                  style: {
                    width: '80px',
                    height: '24px'
                  },
                  props: {
                    value: params.row.twoNext,
                    size:'small',
                    placeholder:"请输入"
                  },
                  on: {
                    input: (val) => {
                      this.projectData[params.index].twoNext = val
                      this.countData.forEach((item, index) => {

                        if (item.itemTitle === params.row.itemTitle) {
                          if(item.data[2].twoNext !== "" && item.data[2].twoNext !== "/") {
                            item.data[item.data.length - 2].twoNext = Number(val) + Number(item.data[2].twoNext)
                          }
                          if(item.data[item.data.length - 2].twoNext !== "" && item.data[item.data.length - 2].twoNext !== "/" &&  item.data[0].twoNext !== "" && item.data[0].twoNext !== "/") {
                            item.data[item.data.length - 1].twoNext = Number(item.data[item.data.length - 2].twoNext) / Number(item.data[0].twoNext)
                            item.data[item.data.length - 1].twoNext = (item.data[item.data.length - 1].twoNext).toFixed(2)
                          }
                        }
                      })
                    }
                  }
                })
              ])
            } else {
              return h('div', {}, params.row.twoNext !== "" ? params.row.twoNext : '/')
            }
          }
        },
        { title: '操作', width: 50, align:'center', key: 'action',
          render: (h, params) => {
            return h('div',{
              style: {
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
            },[
              h('img', {
                style: {
                  width: '11px',
                  height: '11px',
                },
                attrs: {
                  src: this.iconDel,
                },
                on: {
                  click: () => {
                    this.countData = this.countData.filter((item) => {
                      return item.itemTitle !== params.row.itemTitle
                    })
                    this.projectData = []
                    this.countData.forEach((item, index) => {
                      item.data.forEach((child, index1) => {
                        child['itemLength'] = item.data.length
                        child['itemIndex'] = index
                        child['itemTitle'] = item.itemTitle
                      })
                      list_array.forEach(option => {
                        if (item.itemTitle === option.value) {
                          option.disabled = true
                        }
                      })
                      this.projectData = this.projectData.concat(item.data)
                    })
                    if(this.projectData.length === 0) {
                      this.showProfitData = false
                      this.modalHeight = '446px'
                    }
                  }
                }
              })
            ])
          }
        }
      ]
      }
    }
  },

  mounted () {
    this.uploadList = this.$refs.upload.fileList
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_RESEARCH_PANEL'
    ]),
    // 获取报告评级
    getEnumByCode(code) {
      getEnumByCode(code).then(resp => {
        if (resp.data.returnCode === 200) {
          this.gradeArray = resp.data.data.map(item => {
            return {
              label: item.enumName,
              value: item.id,
              children: []
            }
          })
        }
      })
    },

    // 获取报告大类和对应小类
    handleGetReportType () {
      getReportType().then(resp => {
        if (resp.data.returnCode === 200) {
          this.reportType = resp.data.data
          this.largeTypeArr = resp.data.data.map(item => {
            return {
              id: (item.id).toString(),
              name: item.typeName,
              children: []
            }
          })
        }
      })
    },

    handleRowSpan (rowIndex) {
      let rowlength = 0;
      let jibie = 0;

      for(let i = 0 ; i < this.projectData.length; i++)
      {
        let item = this.projectData[i];
        if (rowIndex == rowlength){
          return true;
        }
        if(item.itemIndex == jibie){
          rowlength = rowlength + item.itemLength;
          jibie++;
        }
      }
    },



    handleSpan({ row, column, rowIndex, columnIndex }) {
      if(columnIndex == 0 || columnIndex == 6){
        if(this.handleRowSpan(rowIndex)){
          return [this.projectData[rowIndex].itemLength,1]
        }else{
          return  [0, 0];
        }
      }
    },

    rowClassName(row, index) {
      if(this.handleRowSpan(index)) {
        return 'ivu-table-stripe-even-v'
      } else if (index % 2 === 0){
        return "ivu-table-stripe-even"
      } else {
        return "ivu-table-stripe-odd"
      }
    },

    closeResearchPanel () {
      this.$refs.largeTypeSelect.clear()
      this.$refs.smallTypeSelect.clear()
      this.smallTypeArr = []
      this.isShowFiled = ['1','2','3','4','5','7','8']
      this.stock = ''
      this.stockRating = ''
      this.sixMonthPrice1 = null
      this.sixMonthPrice = null
      if(this.largeTypeName === '公司研究' && this.currency === null) {
        this.$refs.currencySelect.clear()
      }
      this.currency = null

      if(this.industryName === null && (this.largeTypeName === '公司研究' || this.largeTypeName === '行业报告')) {
        this.$refs.tradeSelect.clearSingleSelect()
      }
      this.tradeName = null
      this.stockRating= ''
      this.industryName = null
      this.investMarkName = null
      if (this.largeTypeName === '公司研究' || this.largeTypeName === '行业报告'){
        this.$refs.stockRatingSelect.clear()
      }
      if (this.largeTypeName === '公司研究') {
        this.$refs.stockSelectEl.clearSingleSelect()
      }
      if (this.largeTypeName === '公司研究') {
        this.$refs.stockSelectEl.setQuery('')
        this.$refs.stockRatingSelect.clear()
      }
      this.countData = []

      this.showProfitData = false
      // this.stockMenuData = []
      // if (this.largeType == 100035) {
      //   this.$refs.tradeSelect.clearSingleSelect()
      //   this.$refs.tradeSelect.setQuery('')
      // } else if (this.largeType == 100031) {
      //    this.tradeName = ''
      //    this.stock = ''
      // } else {
      //   this.tradeName = ''
      //   this.$refs.stockSelectEl.clearSingleSelect()
      //   this.$refs.stockSelectEl.setQuery('')
      // }

      // this.isResearchTitleShowed = false
      // this.title = ''
      // this.keywords = ''
      this.summary = ''
      this.publicStatus = false
      this.$refs.upload.clearFiles()
      this.noteFiles = []
      this.projectData = []
      this.showProfitData = false
      // this.researchTitle = ''
      this.modalHeight = '445px'

      this.TOGGLE_SHOW_RESEARCH_PANEL(false)
    },

    handleUpload (file) {
      // this.isLoading = true
      let promise = new Promise((resolve) => {
        this.$nextTick(function () {
          if (this.uploadList.length > 0) {
            this.$refs.uploadList.scrollTop = 32 * (this.uploadList.length + 1)
          }
          resolve(true);
        });
      })
      return promise; //通过返回一个promis对象解决

    },

    handleSuccess (resp, file) {
      this.strokeColor = '#1890FF'
      console.log(resp)
      if (resp.returnCode === 200) {
        file.url = resp.data.attachUrl
        file.name = resp.data.attachTitle
        file.type = resp.data.attachType
        this.noteFiles = this.noteFiles.concat(resp.data)
        if (parseFloat(this.modalHeight) <= 535) {
          this.modalHeight = parseFloat(this.modalHeight) + 32 + 'px'
        }
      } else {
        this.strokeColor = '#FF5500'
        file.showProgress = true
        this.$Message.error('附件上传失败')
      }
    },

    handleProgress (fileList) {

    },

    handleError(error) {
      console.log(error)
      this.$Message.error('附件上传失败')
    },

    deleteFile (file) {
      let idx = this.uploadList.indexOf(file)
      this.uploadList.splice(idx, 1)

      this.noteFiles.forEach(item => {
        console.log(item,  file)
        if (item.attachTitle === file.name) {
          item.status = 1
          this.$Message.error('附件删除成功')
        }
      })

      this.$nextTick(() => {
        // if (this.uploadList.length === 0) {
        //   this.modalHeight = '445px'
        //   return
        // }
        // if (parseFloat(this.modalHeight) >= 445 && this.$refs.uploadList.clientHeight < 80) {
        //   this.modalHeight = parseFloat(this.modalHeight) - 32 + 'px'
        // } else {
        //   return
        // }
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

    // searchTrade() {
    //   getReportTrade().then(res => {
    //     console.log(res.data)
    //     if (res.data.returnCode === 200) {
    //       this.tradeMenuData = res.data.body.map(item => {
    //         return {
    //           label: item.name,
    //           value: item.code
    //         }
    //       })
    //     }
    //   })
    // },

    searchStock (query) {
      this.loadingStock = true
      getReportStock({
        keyword: query.trim(),
        limit: 20,
        userId: this.userInfo.usercode
      }).then(resp => {
        this.loadingStock = false
        if (resp.data.returnCode === 200) {
          this.stockMenuData = resp.data.data.map(item => {
            return {
              value: item.stockCode,
              label: `${item.stockName} ${item.stockCode}`,
              // mktcode: item.mktcode,
              // trade: item.industrycode,
              // tradeName: item.industryname
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
      console.log(this.projectData)
      let valuation = []
      if (this.isShowFiled.indexOf('7') > -1) {
        let i = valutionYears.length - 4;
        let dic = {}
        for (let j = 0; j < this.projectData.length; j ++) {
          dic[this.projectData[j].fieldIndex] = this.projectData[j].pre
          dic['targetYear'] = valutionYears[i]
          dic['stockCode'] = this.stock
        }
        i ++;
        valuation.push(dic);
        let dic1 = {};
        for (let j = 0; j < this.projectData.length; j ++) {
          dic1[this.projectData[j].fieldIndex] = this.projectData[j].current
          dic1['targetYear'] = valutionYears[i]
          dic1['stockCode'] = this.stock
        }
        i ++;
        valuation.push(dic1);
        let dic2 = {}
        for (let j = 0; j < this.projectData.length; j ++) {
          dic2[this.projectData[j].fieldIndex] = this.projectData[j].oneNext
          dic2['targetYear'] = valutionYears[i]
          dic2['stockCode'] = this.stock
        }
        valuation.push(dic2);
        let dic3 = {}
        i ++
        for (let j = 0; j < this.projectData.length; j ++) {
          dic3[this.projectData[j].fieldIndex] = this.projectData[j].twoNext
          dic3['targetYear'] = valutionYears[i]
          dic3['stockCode'] = this.stock
        }
        valuation.push(dic3);
      }
      console.log(valuation)
      if (this.isSyncing) {
        this.$Message.warning('同步未完成无法提交，请等待同步完成后再提交')
        return
      }
      if (this.largeType==''){
        this.$Message.error('请选择报告大类')
        return
      }
      this.confirmResearchData = []

      let stockRatingName = ''
      this.gradeArray.forEach(item => {
        if (item.value === Number(this.stockRating)) {
          stockRatingName = item.label
        }
      })

      let data = {
        title: this.title,//报告标题
        stockCode: this.stock,//股票代码
        inductryName: this.industryName === null ? this.tradeName : this.industryName, //行业名称
        investMark: Number(this.stockRating), //投资评级Id
        sixMonthPrice: this.sixMonthPrice1, //六月目标价
        currency: this.currency !== null ? (this.currency === 'CNY' ? '1' : this.currency === 'HKD' ?'2' : '3') : this.currencyName,//币种
        authorId: this.userInfo.usercode, // userCOde
        authorName: this.userInfo.username, //username
        firstReportType: Number(this.largeType), //报告大类
        secondReportType: Number(this.smallType), //报告小类
        stockRating: stockRatingName, //投资评级中文
        valuations: valuation, // 问题
        attachments: this.noteFiles, //transAttachMentList(this.noteFiles)
        noteFiles: this.noteFiles, //笔记附件
        // attachmentList: transAttachMentList(this.noteFiles),
        // attachmentflag: this.attachmentflag,
        // indcode: this.largeType!=100035?this.trade:this.tradeName.split(' ')[0],
        // indname: this.largeType!=100035?this.tradeName:this.tradeName.split(' ')[1],
        // isupdatepeandeps: 0,
        // mktcode: this.stockItem == null ? '':this.stockItem.mktcode,
        // reporttypeid: this.smallType,
        // scode: this.stock?this.stock:'',
        // scodename: this.stockItem==null ? '' : this.stockItem.label.split(' ')[0],
        // status: 50,
        // stype: 2,
        // keywords: this.keywords,
        summary: this.summary, //摘要
        // title: this.title,
        // // username: this.userInfo.usercode
        // // username: this.userInfo.usernamePinYin
        // username: this.userInfo.local_name,
        noteId: this.noteId,//笔记id
        syncPublic: this.publicStatus,
        // isConform: false,
        // publicTitle: this.researchTitle,
        publicTitle: this.title,
        syncAnswer: this.post_data.syncAnswer,
        titleRepeatAnswer: this.post_data.titleRepeatAnswer
      }

      if (data.secondReportType === '') {
        this.$Message.error('请选择报告小类')
        return
      }
      if(data.investMark === '' && this.largeTypeName === '公司研究') {
        this.$Message.error('请选择投资评级')
        return
      }
      if(data.sixMonthPrice === ''&& this.largeTypeName === '公司研究') {
        this.$Message.error('六月目标价不能为空')
        return
      }
      if(data.currency === ''&& this.largeTypeName === '公司研究') {
        this.$Message.error('盈利预测币种不能为空')
        return
      }

      // if (data.scode === '') {
      //   this.$Message.error('请选择股票')
      //   return
      // }
      // if (data.title === '') {
      //   this.$Message.error('请输入报告标题')
      //   return
      // }
      // if (data.keywords === '') {
      //   this.$Message.error('请填写关键字')
      //   return
      // }
      if (data.summary === '') {
        this.$Message.error('笔记不能为空')
        return
      }

      // if (this.publicStatus && this.researchTitle === '') {
      //   this.$Message.error('研究部晨会名称不能为空')
      //   return
      // }
      if (data.inductryName === ''&& (this.largeTypeName === '公司研究' || this.largeTypeName === '行业报告')) {
        this.$Message.error('行业不能为空')
        return
      }

      this.confirmResearchData = data

      console.log(this.confirmResearchData)
      // this.submitEnquiry(data)
      if (this.publicStatus) {
        // this.confirmNote(this.post_data)
      } else {
        // this.submitEnquiry(data)
      }
    },

    submitEnquiry (data) {
      insertReport(data).then(res => {
        if (res.data.returnCode === 200) {
          this.$Message.success('提交成功')
          this.closeResearchPanel()
          this.isResearchTitleShowed = false
          this.isNotesyncAnswerShowed = false
          this.isbackAnswerShowed = false
        }
      })
    },

    confirmNote(post_data) {
      this.post_data.publicTitle = this.researchTitle
      console.log(post_data)
      reportIsRepeat(post_data).then(resp => {
        console.log('提交研究部晨会---->', resp)
        if (resp.data.returnCode === 200) {
          if (resp.data.body.status === '0') {
            this.confirmResearchData.syncAnswer = this.post_data.syncAnswer
            this.confirmResearchData.titleRepeatAnswer = this.post_data.titleRepeatAnswer
            this.confirmResearchData.publicTitle = this.researchTitle
            console.log(this.confirmResearchData)
            this.submitEnquiry(this.confirmResearchData)
          } else if (resp.data.body.status === '1'){
            //"1" 笔记提交至研究部晨会、是要覆盖 （是 syncAnswer = true） false
            this.isNotesyncAnswerShowed = true
          } else {
            // "2"   标题重复  (是 titleRepeatAnswer = true)
            this.isResearchTitleShowed = true
          }
        }
      })
    },

    confirmPostTitle () {

      this.post_data.titleRepeatAnswer = true
      this.confirmNote(this.post_data)
      this.isResearchTitleShowed = false

    },

    noPostTitle () {
      this.isbackAnswerShowed = true
      this.isResearchTitleShowed = false
    },

    confirmSyncAnswer() { //笔记覆盖
      this.post_data.syncAnswer = true
      this.confirmNote(this.post_data)
      this.isNotesyncAnswerShowed = false
    },

    noSyncAnswer() { //新建
      this.post_data.syncAnswer = false
      this.confirmNote(this.post_data)
      // this.confirmResearchData.syncAnswer = false
      // console.log('笔记新建',this.confirmResearchData)
      this.isNotesyncAnswerShowed = false

      // this.submitEnquiry (this.confirmResearchData)
    },

    backSyncAnswer () {
      this.isbackAnswerShowed = false
      this.post_data.titleRepeatAnswer = null
    },
    // 添加项目
    handleAddProject() {
      let j = 0, method
      list_array.forEach((item, index) => {

        if (index === j && !item.disabled) {
          method = item.label
        } else {
          j ++
        }
      })
      let params = {
        currency: this.currency !== null ? (this.currency === 'CNY' ? '1' : this.currency === 'HKD' ?'2' : '3') : this.currencyName,
        method: method,
        stockCode: this.stock
      }
      console.log(params)
      // if (j >= list_array.length) return
      if (this.stock === '') {
        this.$Message.error('请选择股票')
        return
      }
      getProfitItem(params).then(resp => {
        // console.log(resp)
        if (resp.data.returnCode === 200) {
          if (resp.data.data.valutionItems !== null) {
            this.showProfitData = true
            this.modalHeight = '646px'
            this.projectData = []
            // valutionYears = resp.data.data.valutionYears
            this.countData = this.countData.concat(resp.data.data.valutionItems)
            this.countData.forEach((item, index) => {
              item.data.forEach((child, index1) => {
                child['itemLength'] = item.data.length
                child['itemIndex'] = index
                child['itemTitle'] = item.itemTitle
              })
              list_array.forEach(option => {
                if (item.itemTitle === option.value) {
                  option.disabled = true
                }
              })
              this.projectData = this.projectData.concat(item.data)
            })
          }
        }
      })
    },
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
  padding 20px 24px 0
  .report
    width 100%
    display flex
    flex 1
    justify-content flex-start
    .form-item
      position relative
      display flex
      flex-direction row
      align-items baseline
      &.report_title
        width 100%
        input
          width 658px
          height 28px
      &.small
        float left
        align-items center
        &:nth-of-type(2n)
          margin-right 0
      .form-label
        width 72px
        text-align right
        margin-right 13px
        font-size 12px
        &.right-label
          width 79px
          margin-left 27px
      input
        padding-left 10px
        border-radius 4px
        border 1px solid #E9E9E9
        outline none
        height 28px
        width 140px

.upload-button
  color #DDAF59 !important
  border-color #DDAF59 !important
  box-shadow none !important
  &:hover
    color #DDAF59 !important
    border-color #DDAF59 !important

.upload-list
  // position absolute
  width 658px
  max-height 64px
  margin-bottom 4px
  // padding-left 10px
  // background red
  right 0
  top 50px
  line-height 32px
  font-size 14px
  color #333
  overflow-y scroll
  display flex
  flex 1
  justify-content space-between
  flex-wrap wrap
  .upload-list-item
    position relative
    width 46%
    height 32px
    display inline-block
    cursor pointer
    &:hover
      color rgba(195,137,30,1)
      span.file-img
        background-image url('../../assets/images/lanhu/report-height@3.png')
      .icon-del
        display block
    span
      display inline-block
      width 90%
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
      margin-left 22px
      font-size 14px
      &.file-img
        position absolute
        top 50%
        left -22px
        transform translateY(-50%)
        width 13px
        height 13px
        background-image url('../../assets/images/lanhu/report@3.png')
        background-size contain
        background-position center
        background-repeat no-repeat
  .icon-del
    position absolute
    z-index 999
    top 50%
    right 11px
    transform translateY(-50%)
    width 11px
    height 13px
    background-image url('../../assets/images/lanhu/del-file-highlight@3.png')
    background-size contain
    background-position center
    background-repeat no-repeat
    display none

.button-group
  width 38%
  bottom 20px
  left 77%
  &.report-button
    bottom 20px
    width 160px
    left 87.5%

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
.project
  height 164px
  margin-top 9px
  // overflow-y overlay
.stock-select
  width 140px !important
  height 28px !important
  font-size 12px !important
  .ivu-select-item
    font-size 12px !important
    // position absolute !important
    // top 6px !important
    // left 63px !important
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
//   // bottom -35px


.mem-item
  display flex
  // height 50px
  flex-direction row
  justify-content space-between
  align-items center
  // padding-left 10px
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
  margin-top 6px
.researchTitle
  text-align center
  font-size:12px;
  // font-family:PingFangSC;
  font-weight:400;
  color:rgba(51,51,51,1);
  line-height:110px
input:disabled
  background-color #fafafa;
input[disabled]
  background-color #fafafa;
* html input.disabled
  background-color #fafafa
</style>
<style lang="stylus">
.ivu-select-dropdown
  .ivu-select-dropdown-list
    max-height 200px !important
    &::-webkit-scrollbar
      display block !important
.__vuescroll
  height 200px !important

.ivu-btn:focus
  box-shadow 0 0 0 2px #fff

.ivu-table th
  height 32px !important
  white-space nowrap !important
  overflow hidden !important
  background-color #fff !important
  line-height 32px !important
  text-align center !important
.ivu-table td
  height 32px !important
  .ivu-select-dropdown
    max-height 120px !important
.ivu-table-wrapper
  border 0px !important
  overflow visible !important
  .ivu-table-header
    height 32px !important
    font-size 12px !important
    background #fff !important
    font-weight 500 !important
    color rgba(51,51,51,1) !important
    border-bottom 1px solid #f0f0f0
    .ivu-select-dropdown
      max-height 120px !important
    .ivu-table-cell
      padding 0 !important
      height 30px !important
      line-height 30px !important
      text-align center !important
      width 100%
      span
        width 100%
.ivu-table-cell
  padding 0 !important
  line-height 32px !important
  font-size 12px !important
.ivu-table:after
  content ''
  width 0px !important
  height 0
  position absolute
  top 0
  right 0
  background-color #fff
  z-index 3
.ivu-table td, .ivu-table th
  border-bottom-color #f0f0f0 !important
.ivu-table:before
  background-color #f0f0f0
.ivu-table-header thead tr th
  padding 0 !important
/*偶数行*/
.ivu-table-stripe-even
  td
    background-color #F9F9F9 !important
.ivu-table-stripe-even-v
  td
    background-color #F9F9F9 !important
    &:nth-child(1), &:nth-last-child(1)
      background-color #fff !important
/*奇数行*/
.ivu-table-stripe-odd td
  background-color #fff !important


.ivu-input:focus
  border-color #DDAF59 !important
  box-shadow 0 0 0 2px rgba(221,175,89,.1) !important
.ivu-input:hover
  border-color #DDAF59 !important
.ivu-table-overflowX
  overflow-x hidden
.ivu-progress-bg
  width 100%
.ivu-progress
  position absolute !important
  top 12px !important
  width 96% !important
  left 0 !important
.sixMonthPrice .ivu-input
  height 28px !important
.ivu-input-small
  font-size 12px !important
.ivu-icon .ivu-icon-ios-arrow-down .ivu-select-arrow
  font-size 12px
</style>

