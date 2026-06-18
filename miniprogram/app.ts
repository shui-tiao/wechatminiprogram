/**
 * 小程序入口文件
 * 定义全局生命周期函数和全局数据
 */
// app.ts
App<IAppOption>({
  /**
   * 全局数据对象，可在所有页面中访问
   */
  globalData: {},
  
  /**
   * 小程序初始化生命周期函数
   * 当小程序初始化完成时触发，全局只触发一次
   */
  onLaunch() {
    // 展示本地存储能力：记录启动时间日志
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录：获取用户登录凭证
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
  
  /**
   * 小程序显示生命周期函数
   * 当小程序从后台进入前台显示时触发
   */
  onShow() {
    // 用户首次打开小程序时展示功能选择界面
    const hasVisitedFeatureSelect = wx.getStorageSync('hasVisitedFeatureSelect')
    if (!hasVisitedFeatureSelect) {
      wx.reLaunch({
        url: '/pages/feature-select/feature-select',
      })
    }
  },
})