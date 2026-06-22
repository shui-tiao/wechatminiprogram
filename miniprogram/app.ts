/**
 * 小程序入口文件
 * 定义全局生命周期函数和全局数据
 */
// app.ts
App<IAppOption>({
  /**
   * 全局数据对象，可在所有页面和组件中通过 getApp() 访问
   */
  globalData: {
    debugLogs: [],        // 调试日志缓存数组，每个元素为一条日志字符串
    debugLogsToShare: '', // 待分享的日志拼接文本，用于跨页面导出日志
  },
  
  /**
   * 小程序初始化生命周期函数
   * 当小程序初始化完成时触发，全局只触发一次
   */
  onLaunch() {
    // 展示本地存储能力：记录启动时间日志
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  
  /**
   * 小程序显示生命周期函数
   * 当小程序从后台进入前台显示时触发
   * 标记用户已访问过功能选择页面，避免后续从正常流程重复跳转到功能选择页
   */
  onShow() {
    wx.setStorageSync('hasVisitedFeatureSelect', 'true')
  },

  /**
   * 页面不存在时的处理函数
   * 当打开不存在的页面时触发（如旧版本缓存的页面路径）
   */
  onPageNotFound(res) {
    // 跳转到功能选择页面（首页）
    wx.reLaunch({
      url: '/pages/feature-select/feature-select',
    })
  },
})