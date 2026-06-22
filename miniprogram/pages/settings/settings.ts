/**
 * 设置页面
 * 提供界面风格选择功能
 */
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentStyle: 'gradient', // 当前选择的风格：gradient（渐变）或 tech（科技）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 从存储中读取用户选择的风格
    const savedStyle = wx.getStorageSync('uiStyle') || 'gradient'
    this.setData({
      currentStyle: savedStyle,
    })
  },

  /**
   * 生命周期函数--监听页面显示
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
   * 选择界面风格
   * @param e 点击事件对象
   */
  selectStyle(e: any) {
    const style = e.currentTarget.dataset.style
    
    // 保存用户选择的风格到存储
    wx.setStorageSync('uiStyle', style)
    
    // 更新页面数据
    this.setData({
      currentStyle: style,
    })

    // 显示提示
    const styleMap: Record<string, string> = {
      gradient: '渐变风格',
      tech: '科技风格',
      outline: '边框风格',
    }
    wx.showToast({
      title: `已切换至${styleMap[style] || style}`,
      icon: 'success',
      duration: 1500,
    })
  },

  /**
   * 返回功能大厅
   */
  goBack() {
    wx.navigateBack()
  },
})