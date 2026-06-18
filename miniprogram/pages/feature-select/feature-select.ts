/**
 * 功能选择页面
 * 用户首次进入小程序时展示的功能入口界面
 */
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
    ],
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
   * @param e 点击事件对象，包含 currentTarget.dataset.id
   */
  onFeatureTap(e: any) {
    const { id } = e.currentTarget.dataset
    if (id === 'vibrator') {
      // 导航到振动器页面
      wx.navigateTo({
        url: '/pages/vibrator/vibrator',
      })
    }
  },
})