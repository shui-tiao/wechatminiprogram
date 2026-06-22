/**
 * 答案之书页面
 * 用户在心中默念问题，点击翻开随机获得一条答案
 */
import { ThemeManager } from '../../utils/theme'
import { debugLog, getDebugLogs } from '../../utils/debug'

// 答案库 - 涵盖人生各方面的简短答案
const ANSWERS: string[] = [
  "是", "否", "或许", "稍后再问",
  "毫无疑问", "结果未明", "保持期待",
  "别指望了", "绝对肯定", "暂时观望",
  "机会渺茫", "积极行动", "改变策略",
  "无法预测", "遵循直觉", "需要努力",
  "时机未到", "放手去做", "谨慎为好",
  "顺其自然", "再想想看", "大胆尝试",
  "静待花开", "聚焦当下", "相信过程",
  "答案就在你心中", "这是一个好时机",
  "不要犹豫", "耐心等待", "听从内心",
  "值得一试", "考虑其他选择", "坚持下去",
  "放下执念", "重新审视", "勇敢面对",
  "一切都是最好的安排", "跟随你的热情",
  "现在还不是时候", "相信你的直觉",
  "别想太多", "行动胜于空想", "接受不确定性",
  "前路充满可能", "保持开放心态",
]

Page({
  data: {
    // 答案相关
    currentAnswer: '',
    showAnswer: false,

    // 主题相关
    themeColor: '#667eea',
    themeColor2: '#764ba2',
    textColor: '#ffffff',
    containerBg: '',
    btnBg: '',
    uiStyle: 'gradient',
    containerClass: '',

    // 调试相关
    showDebug: false,
    debugLogs: [] as string[],
  },

  themeManager: null as unknown as ThemeManager,

  onLoad() {
    this.themeManager = new ThemeManager(this)
    this.themeManager.applyOnLoad()

    // 如果调试模式已开启，自动显示调试面板
    if (wx.getStorageSync('debugMode') === true) {
      this.setData({
        showDebug: true,
        debugLogs: getDebugLogs().slice(),
      })
    }
  },

  onShow() {
    this.themeManager.applyOnShow()
  },

  onThemeChange(e: any) {
    this.themeManager.onSystemThemeChange(e)
  },

  /**
   * 翻开答案 - 随机抽取并展示
   */
  onRevealAnswer() {
    debugLog('[ANSWER-REVEAL]', '用户翻开答案之书')

    const index = Math.floor(Math.random() * ANSWERS.length)
    const answer = ANSWERS[index]

    debugLog('[ANSWER-REVEAL]', `抽取答案: "${answer}" (索引: ${index})`)

    this.setData({
      currentAnswer: answer,
      showAnswer: true,
    })
  },

  /**
   * 再问一次 - 重置回到封面
   */
  onAskAgain() {
    debugLog('[ANSWER-AGAIN]', '用户点击"再问一次"')
    this.setData({
      currentAnswer: '',
      showAnswer: false,
    })
  },

  /**
   * 切换调试面板
   */
  onToggleDebug() {
    const show = !this.data.showDebug
    this.setData({
      showDebug: show,
      debugLogs: getDebugLogs().slice(),
    })
  },
})