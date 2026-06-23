/**
 * 功能选择页面
 * 用户首次进入小程序时展示的功能入口界面
 */

/** 功能 ID 到页面路径的映射表 */
const FEATURE_ROUTES: Record<string, string> = {
  vibrator: '/pages/vibrator/vibrator',
  'answer-book': '/pages/answer-book/answer-book',
  'what-to-eat': '/pages/what-to-eat/what-to-eat',
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 功能列表数据，包含每个功能的图标、标题、描述和主题色
    features: [
      {
        id: 'vibrator',           // 功能唯一标识
        icon: '📳',               // 功能图标（emoji）
        title: '振动器',           // 功能名称
        desc: '设置振动时长，体验设备振动',  // 功能描述
        color: '#667eea',         // 主题色（用于图标背景）
      },
      {
        id: 'answer-book',
        icon: '📖',
        title: '答案之书',
        desc: '心中默念问题，翻开获得答案',
        color: '#e94560',
      },
      {
        id: 'what-to-eat',
        icon: '🍽️',
        title: '吃什么',
        desc: '纠结吃什么？让命运来决定',
        color: '#f093fb',
      },
    ],
    showDebugLogs: false,        // 是否显示日志查看器
    debugLogsContent: '',        // 日志内容
  },

  /**
   * 生命周期函数--监听页面加载
   * 页面加载时标记已访问，避免后续再次跳转到此页
   */
  onLoad() {
    // 标记已访问过功能选择页
    wx.setStorageSync('hasVisitedFeatureSelect', true)
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次页面显示时，实时检测系统主题并设置导航栏颜色
   * CSS 的 prefers-color-scheme 会同步更新页面背景，两边始终一致
   */
  onShow() {
    const res = wx.getAppBaseInfo()
    const isDark = res.theme === 'dark'
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#000000' : '#ffffff',
    })
  },

  /**
   * 功能卡片点击事件
   * 根据点击的功能 ID 导航到对应页面
   * 可通过 data-* 自定义属性区分不同的功能入口
   * @param e 点击事件对象，包含 currentTarget.dataset.id
   */
  onFeatureTap(e: any) {
    const { id } = e.currentTarget.dataset
    const url = FEATURE_ROUTES[id]
    if (url) {
      wx.navigateTo({ url })
    }
  },

  /**
   * 设置卡片点击事件
   * 导航到设置页面
   */
  onSettingsTap() {
    wx.navigateTo({
      url: '/pages/settings/settings',
    })
  },

  /**
   * 点击"更多功能敬请期待"时弹出调试模式选择
   * 调试模式仅在开发/测试阶段使用，开启后可在控制台查看详细振动日志
   * 选择"退出"时会先询问是否导出日志，便于测试人员收集调试信息
   */
  onDebugModeTap() {
    wx.showModal({
      title: '调试模式',
      content: '是否进入调试模式？',
      confirmText: '进入',
      cancelText: '退出',
      success: (res) => {
        if (res.confirm) {
          // 进入调试模式
          wx.setStorageSync('debugMode', true)
          wx.showToast({
            title: '已开启调试模式',
            icon: 'none',
            duration: 1500,
          })
        } else if (res.cancel) {
          // 退出调试模式前，询问是否复制日志
          this.promptCopyLogsBeforeExit()
        }
      },
    })
  },

  /**
   * 退出调试模式前询问是否导出日志
   */
  promptCopyLogsBeforeExit() {
    wx.showModal({
      title: '退出调试模式',
      content: '是否导出调试日志？',
      confirmText: '导出',
      cancelText: '不导出',
      success: (res) => {
        if (res.confirm) {
          // 从全局数据获取日志
          const app = getApp()
          const globalLogs = app.globalData.debugLogs || []
          const allLogs = globalLogs.join('\n')
          
          if (allLogs) {
            // 显示日志查看器
            this.setData({
              showDebugLogs: true,
              debugLogsContent: allLogs,
            })
          } else {
            wx.showToast({
              title: '暂无调试日志',
              icon: 'none',
              duration: 1500,
            })
            // 关闭调试模式
            wx.setStorageSync('debugMode', false)
            wx.showToast({
              title: '已关闭调试模式',
              icon: 'none',
              duration: 1500,
            })
          }
        } else {
          // 关闭调试模式
          wx.setStorageSync('debugMode', false)
          wx.showToast({
            title: '已关闭调试模式',
            icon: 'none',
            duration: 1500,
          })
        }
      },
    })
  },

  /**
   * 关闭日志查看器
   */
  onCloseDebugLogs() {
    this.setData({
      showDebugLogs: false,
      debugLogsContent: '',
    })
    // 清空全局日志
    const app = getApp()
    app.globalData.debugLogs = []
  },
})