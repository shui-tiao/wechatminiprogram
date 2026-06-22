/**
 * 自定义导航栏组件
 * 提供可配置的导航栏，支持返回按钮、首页按钮、标题、加载状态等功能
 * 适配 iOS/Android 不同平台的样式差异
 */
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表（外部传入）
   */
  properties: {
    // 扩展类名，用于外部自定义样式
    extClass: {
      type: String,
      value: ''
    },
    // 导航栏标题
    title: {
      type: String,
      value: ''
    },
    // 导航栏背景色
    background: {
      type: String,
      value: ''
    },
    // 导航栏文字/图标颜色
    color: {
      type: String,
      value: ''
    },
    // 是否显示返回按钮
    back: {
      type: Boolean,
      value: true
    },
    // 是否显示加载状态
    loading: {
      type: Boolean,
      value: false
    },
    // 是否显示首页按钮
    homeButton: {
      type: Boolean,
      value: false,
    },
    // 显示隐藏时是否启用 opacity 动画效果
    animated: {
      type: Boolean,
      value: true
    },
    // 显示隐藏导航，隐藏的时候 navigation-bar 的高度占位还在
    show: {
      type: Boolean,
      value: true,
      observer: '_showChange'  // 属性变化时调用的方法
    },
    // back 为 true 时，返回的页面深度（默认返回上一页）
    delta: {
      type: Number,
      value: 1
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: '',  // 导航栏显示样式：opacity 动画样式或 display 直接显隐样式
    ios: false,        // 是否为 iOS 平台（用于适配不同的样式表现）
    innerPaddingRight: '',  // 右侧内边距样式，将导航栏内容左移以避开胶囊按钮
    leftWidth: '',          // 左侧区域宽度样式，定义返回按钮的可点击区域
    safeAreaTop: '',        // 安全区域顶部样式，适配刘海屏的顶部内边距
  },
  /**
   * 组件生命周期函数
   */
  lifetimes: {
    /**
     * 组件实例进入页面节点树时触发
     * 计算导航栏布局参数，适配不同平台和设备
     */
    attached() {
      // 获取胶囊按钮位置信息
      const rect = wx.getMenuButtonBoundingClientRect()
      // 获取设备信息（平台、型号等）
      const deviceInfo = wx.getDeviceInfo()
      // 获取窗口信息（宽度、安全区域等）
      const windowInfo = wx.getWindowInfo()
      // 判断平台类型
      const isAndroid = deviceInfo.platform === 'android'
      const isDevtools = deviceInfo.platform === 'devtools'
      // 设置导航栏样式数据
      this.setData({
        ios: !isAndroid,  // iOS 平台标识
        // 右侧内边距：确保内容不与胶囊按钮重叠
        innerPaddingRight: `padding-right: ${windowInfo.windowWidth - rect.left}px`,
        // 左侧区域宽度：返回按钮的可点击区域
        leftWidth: `width: ${windowInfo.windowWidth - rect.left}px`,
        // 安全区域顶部样式：适配刘海屏（仅 Android 和开发者工具需要）
        safeAreaTop: isDevtools || isAndroid ? `height: calc(var(--height) + ${windowInfo.safeArea.top}px); padding-top: ${windowInfo.safeArea.top}px` : ''
      })
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * show 属性变化时的回调
     * 根据 animated 属性决定使用 opacity 动画还是直接隐藏
     * @param show 是否显示导航栏
     */
    _showChange(show: boolean) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        // 使用 opacity 动画过渡
        displayStyle = `opacity: ${
          show ? '1' : '0'
        };transition:opacity 0.5s;`
      } else {
        // 直接显示/隐藏
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    /**
     * 返回按钮点击事件
     * 调用 wx.navigateBack 返回上一页或指定深度的页面
     * 同时触发 back 事件通知父组件
     */
    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      // 触发 back 事件，通知父组件（便于父组件执行自定义逻辑）
      this.triggerEvent('back', { delta: data.delta }, {})
    }
  },
})
