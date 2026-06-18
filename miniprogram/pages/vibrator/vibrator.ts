/**
 * 振动器页面
 * 提供振动时长设置和振动强度切换功能
 * 
 * 调试模式：由 localStorage('debugMode') 控制
 * 当 debugMode 为 true 时，才会记录详细的振动日志
 * 测试人员可通过微信开发者工具控制台查看日志
 */
// #region debug-point: 调试日志模块

/**
 * 获取当前调试模式状态
 * @returns true = 调试模式开启，false = 调试模式关闭（默认关闭）
 */
function isDebugMode(): boolean {
  // 确保默认值是关闭，只有显式设置为 true 时才开启
  return wx.getStorageSync('debugMode') === true
}

/**
 * 记录调试日志（仅在调试模式开启时生效）
 * @param tag 日志标签（如 [VIBRATE-API]、[DEVICE-CHECK]）
 * @param message 日志内容
 * @param data 附加数据对象
 */
function debugLog(tag: string, message: string, data?: object) {
  if (!isDebugMode()) return  // 仅在调试模式下输出日志
  
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${tag} ${message}${data ? ` | ${JSON.stringify(data)}` : ''}`
  
  // 写入微信日志管理器（可通过 wx.getLogManager 获取）
  const logger = wx.getLogManager({ level: 1 })
  logger.log(logEntry)
  
  // 同时写入内存缓存（方便实时查看）
  debugLogs.push(logEntry)
  
  // 保存到全局数据（即使页面销毁也能获取）
  const app = getApp()
  if (!app.globalData.debugLogs) {
    app.globalData.debugLogs = []
  }
  app.globalData.debugLogs.push(logEntry)
  
  // 控制台输出（开发者工具可见）
  console.log(logEntry)
}

const debugLogs: string[] = []  // 内存日志缓存

/**
 * 获取所有调试日志（供测试人员调用）
 * 使用方法：在微信开发者工具控制台输入 getCurrentPages()[0].getDebugLogs()
 */
function getDebugLogs(): string[] {
  return debugLogs.slice()
}

/**
 * 导出调试日志（用于跨页面共享）
 */
function exportDebugLogs(): string {
  // 优先返回全局数据中的日志
  const app = getApp()
  const globalLogs = app.globalData.debugLogs || []
  return globalLogs.join('\n')
}

/**
 * 清空调试日志缓存
 */
function clearDebugLogs(): void {
  debugLogs.length = 0
  const app = getApp()
  app.globalData.debugLogs = []
}
// #endregion

Page({
  /**
   * 页面的初始数据
   */
  data: {
    seconds: '',              // 用户输入的秒数
    isVibrating: false,       // 是否正在振动
    remainingSeconds: 0,      // 剩余秒数
    progress: 0,              // 进度条百分比
    lastSeconds: '',          // 上次使用的秒数
    showReuseButton: false,   // 是否显示"使用上次时间"按钮
    themeColor: '#667eea',    // 主题渐变色1
    themeColor2: '#764ba2',   // 主题渐变色2
    textColor: '#ffffff',     // 文字颜色
    supportVibrate: true,     // 设备是否支持振动
    deviceModel: '',          // 设备型号
    vibrateIntensity: 'strong', // 振动强度：strong/weak
    containerBg: '',           // 容器背景渐变
    btnBg: '',                // 按钮背景渐变
    progressBg: '',           // 进度条背景渐变
    platform: '',             // 设备平台（android/ios）
    isXiaomi: false,          // 是否为小米设备
  },

  timer: null as ReturnType<typeof setInterval> | null,      // 倒计时定时器
  vibrateTimer: null as ReturnType<typeof setTimeout> | null,  // 振动循环定时器
  isStopped: false,           // 是否已停止
  isDarkTheme: false,          // 是否暗色模式

  /**
   * 生命周期函数--监听页面加载
   * onLoad函数中的内容会在页面加载时自动执行
   */
  onLoad() {
    this.generateRandomTheme()
    this.checkVibrateSupport()
  },

  /**
   * 检查设备是否支持振动功能
   */
  checkVibrateSupport() {
    // #region debug-point: H2 设备检测日志
    debugLog('[DEVICE-CHECK]', '开始检测设备振动支持')
    // #endregion
    
    try {
      const deviceInfo = wx.getDeviceInfo()
      const platform = (deviceInfo.platform || '').toLowerCase()
      const model = deviceInfo.model || '未知设备'

      // #region debug-point: H2 设备检测结果
      debugLog('[DEVICE-CHECK]', '设备信息获取成功', {
        platform,
        model,
        SDKVersion: wx.getAppBaseInfo().SDKVersion,
      })
      // #endregion

      const unsupportedPlatforms = ['windows', 'mac', 'linux', 'pc']
      const isUnsupported = unsupportedPlatforms.some(p => platform.includes(p))

      // 检测是否为小米设备（型号中包含常见小米标识）
      // 匹配规则：xiaomi/redmi/poco、Mi+数字、纯数字开头+字母组合（如 24122RKC7C）
      const isXiaomi = /xiaomi|redmi|poco|mi\s*\d|^\d+[a-z]/i.test(model)

      // #region debug-point: H2 设备判断结果
      debugLog('[DEVICE-CHECK]', '振动支持判断结果', {
        isUnsupported,
        supportVibrate: !isUnsupported,
        isXiaomi,
        isXiaomiRegex: /^\d+[a-z]/i.test(model),
        model,
        unsupportedPlatforms,
      })
      // #endregion

      this.setData({
        supportVibrate: !isUnsupported,
        deviceModel: model,
        platform: platform,
        isXiaomi: isXiaomi,
      })

      if (isUnsupported) {
        setTimeout(() => {
          wx.showModal({
            title: '设备不支持',
            content: `您的设备${model} ${platform}不支持振动功能，推荐使用手机体验。`,
            showCancel: false,
            success: () => {},
            fail: () => {},
          })
        }, 500)
      }
    } catch (err) {
      // #region debug-point: H2 设备检测异常
      debugLog('[DEVICE-CHECK]', '设备检测异常', { error: String(err) })
      // #endregion
      this.setData({
        supportVibrate: true,
        deviceModel: '未知设备',
      })
    }
  },

  /**
   * 生成随机主题颜色
   * 无论当前主题，都生成随机颜色保存到 themeColor/themeColor2，供主题切换时使用
   */
  generateRandomTheme() {
    // 先生成随机颜色（无论当前主题）
    const hue = Math.floor(Math.random() * 360)
    const saturation = Math.floor(Math.random() * 30) + 60
    const lightness1 = Math.floor(Math.random() * 15) + 45
    const lightness2 = Math.floor(Math.random() * 15) + 30

    const color1 = `hsl(${hue}, ${saturation}%, ${lightness1}%)`
    const color2 = `hsl(${hue}, ${saturation}%, ${lightness2}%)`
    const bg = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
    const progressBg = `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`

    // HSL 转 HEX 工具函数
    const hslToHex = (h: number, s: number, l: number): string => {
      s /= 100
      l /= 100
      const a = s * Math.min(l, 1 - l)
      const f = (n: number) => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color).toString(16).padStart(2, '0')
      }
      return `#${f(0)}${f(8)}${f(4)}`
    }

    const hexColor = hslToHex(hue, saturation, lightness1)
    const avgLightness = (lightness1 + lightness2) / 2
    const textColor = avgLightness < 50 ? '#ffffff' : '#333333'
    const navTextColor = lightness1 < 50 ? '#ffffff' : '#000000'

    // 保存随机颜色到 data（供主题切换时恢复）
    this.setData({
      themeColor: color1,
      themeColor2: color2,
    })

    // 根据当前主题设置显示颜色
    const res = wx.getAppBaseInfo()
    const isDark = res.theme === 'dark'
    this.isDarkTheme = isDark

    if (isDark) {
      // 暗色模式：纯黑背景 + 白色文字
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#000000',
      })
      this.setData({
        textColor: '#ffffff',
        containerBg: '#000000',
        btnBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        progressBg: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      })
    } else {
      // 亮色模式：显示随机渐变色
      wx.setNavigationBarColor({
        frontColor: navTextColor,
        backgroundColor: hexColor,
      })
      this.setData({
        textColor: textColor,
        containerBg: bg,
        btnBg: bg,
        progressBg: progressBg,
      })
    }
  },

  /**
   * 根据主题设置页面颜色
   * @param isDark 是否为暗色模式
   */
  setThemeColor(isDark: boolean) {
    this.isDarkTheme = isDark

    if (isDark) {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#000000',
      })
      this.setData({
        textColor: '#ffffff',
        containerBg: '#000000',
        btnBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        progressBg: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      })
    } else {
      const themeColor = this.data.themeColor
      const themeColor2 = this.data.themeColor2
      const hslMatch = themeColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      if (hslMatch) {
        const [, h, s, l] = hslMatch.map(Number)
        const originalL = l
        const hex = (() => {
          const sNorm = s / 100
          const lNorm = l / 100
          const a = sNorm * Math.min(lNorm, 1 - lNorm)
          const f = (n: number) => {
            const k = (n + h / 30) % 12
            const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
            return Math.round(255 * color).toString(16).padStart(2, '0')
          }
          return `#${f(0)}${f(8)}${f(4)}`
        })()
        wx.setNavigationBarColor({
          frontColor: originalL < 50 ? '#ffffff' : '#000000',
          backgroundColor: hex,
        })
        const bg = `linear-gradient(135deg, ${themeColor} 0%, ${themeColor2} 100%)`
        const progressBg = `linear-gradient(90deg, ${themeColor} 0%, ${themeColor2} 100%)`
        const textColor = originalL < 50 ? '#ffffff' : '#333333'
        this.setData({
          textColor: textColor,
          containerBg: bg,
          btnBg: bg,
          progressBg: progressBg,
        })
      }
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const res = wx.getAppBaseInfo()
    this.setThemeColor(res.theme === 'dark')
  },

  /**
   * 监听系统主题变化，实时更新导航栏和页面颜色
   * @param e 主题变化事件，包含 theme 属性
   */
  onThemeChange(e: any) {
    this.setThemeColor(e.theme === 'dark')
  },

  /**
   * 输入框输入事件
   * @param e 输入事件对象
   */
  onInput(e: any) {
    this.setData({
      seconds: e.detail.value,
    })
  },

  /**
   * 复用上次的时间
   */
  reuseLastTime() {
    this.setData({
      seconds: this.data.lastSeconds,
      showReuseButton: false,
    })
  },

  /**
   * 切换振动强度
   */
  toggleIntensity() {
    const intensity = this.data.vibrateIntensity === 'strong' ? 'weak' : 'strong'
    this.setData({
      vibrateIntensity: intensity,
    })
  },

  /**
   * 开始振动
   */
  startVibration() {
    const seconds = parseInt(this.data.seconds)
    
    // #region debug-point: H1 振动启动日志
    debugLog('[VIBRATE-START]', '用户点击开始振动', {
      inputSeconds: this.data.seconds,
      parsedSeconds: seconds,
      intensity: this.data.vibrateIntensity,
      deviceModel: this.data.deviceModel,
    })
    // #endregion
    
    if (!seconds || seconds <= 0) {
      wx.showToast({
        title: '请输入有效秒数',
        icon: 'none',
      })
      // #region debug-point: H1 输入验证失败
      debugLog('[VIBRATE-START]', '输入验证失败：无效秒数')
      // #endregion
      return
    }

    this.isStopped = false
    this.setData({
      isVibrating: true,
      remainingSeconds: seconds,
      progress: 100,
      lastSeconds: this.data.seconds,
      showReuseButton: true,
    })

    // #region debug-point: H1 首次振动 API 调用
    const vibrateApi = this.data.vibrateIntensity === 'strong' ? 'wx.vibrateLong' : 'wx.vibrateShort'
    debugLog('[VIBRATE-API]', `调用 ${vibrateApi}`, { intensity: this.data.vibrateIntensity })
    
    if (this.data.vibrateIntensity === 'strong') {
      wx.vibrateLong({
        success: () => {
          debugLog('[VIBRATE-API]', 'wx.vibrateLong 成功')
        },
        fail: (err) => {
          debugLog('[VIBRATE-API]', 'wx.vibrateLong 失败', { error: JSON.stringify(err) })
        },
      })
    } else {
      wx.vibrateShort({
        type: 'light',
        success: () => {
          debugLog('[VIBRATE-API]', 'wx.vibrateShort 成功')
        },
        fail: (err) => {
          debugLog('[VIBRATE-API]', 'wx.vibrateShort 失败', { error: JSON.stringify(err) })
        },
      })
    }
    // #endregion
    
    this.startTimers(seconds)
  },

  /**
   * 启动倒计时和振动循环定时器
   * @param totalSeconds 总秒数
   */
  startTimers(totalSeconds: number) {
    let remaining = totalSeconds
    const intensity = this.data.vibrateIntensity
    let loopCount = 0  // 振动循环计数器

    // #region debug-point: H3 定时器启动日志
    debugLog('[VIBRATE-LOOP]', '启动振动循环定时器', {
      totalSeconds,
      intensity,
      interval: intensity === 'strong' ? 350 : 150,
    })
    // #endregion

    /**
     * 振动循环函数
     */
    const vibrateLoop = () => {
      if (this.isStopped) {
        // #region debug-point: H3 循环中断日志
        debugLog('[VIBRATE-LOOP]', '振动循环被中断', { loopCount, reason: 'isStopped=true' })
        // #endregion
        return
      }
      
      loopCount++
      const vibrateApi = intensity === 'strong' ? 'wx.vibrateLong' : 'wx.vibrateShort'
      
      // #region debug-point: H1/H3 循环振动 API 调用
      debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} 调用 ${vibrateApi}`, {
        remainingSeconds: remaining,
        loopCount,
      })
      
      if (intensity === 'strong') {
        wx.vibrateLong({
          success: () => {
            debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateLong 成功`)
          },
          fail: (err) => {
            debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateLong 失败`, {
              error: JSON.stringify(err),
              loopCount,
            })
          },
        })
        this.vibrateTimer = setTimeout(vibrateLoop, 350) as unknown as ReturnType<typeof setInterval>
      } else {
        wx.vibrateShort({
          type: 'light',
          success: () => {
            debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateShort 成功`)
          },
          fail: (err) => {
            debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateShort 失败`, {
              error: JSON.stringify(err),
              loopCount,
            })
          },
        })
        this.vibrateTimer = setTimeout(vibrateLoop, 150) as unknown as ReturnType<typeof setInterval>
      }
      // #endregion
    }
    vibrateLoop()

    // 每秒更新倒计时
    this.timer = setInterval(() => {
      if (this.isStopped) return
      remaining--

      if (remaining <= 0) {
        // #region debug-point: H3 倒计时结束日志
        debugLog('[VIBRATE-LOOP]', '倒计时结束，自动停止振动', { totalLoopCount: loopCount })
        // #endregion
        this.isStopped = true
        this.stopVibration(true)
      } else {
        const progress = (remaining / totalSeconds) * 100
        this.setData({
          remainingSeconds: remaining,
          progress: progress,
          seconds: remaining.toString(),
        })
      }
    }, 1000)
  },

  /**
   * 手动停止振动
   */
  manualStop() {
    // #region debug-point: H3 手动停止日志
    debugLog('[VIBRATE-STOP]', '用户手动停止振动', {
      wasVibrating: this.data.isVibrating,
      remainingSeconds: this.data.remainingSeconds,
    })
    // #endregion
    
    this.isStopped = true
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.vibrateTimer) {
      clearTimeout(this.vibrateTimer)
      this.vibrateTimer = null
    }
    this.setData({
      isVibrating: false,
      remainingSeconds: 0,
      progress: 0,
    })
    
    // #region debug-point: H3 停止完成日志
    debugLog('[VIBRATE-STOP]', '振动已手动停止')
    // #endregion
  },

  /**
   * 停止振动
   * @param isFinished 是否正常完成
   */
  stopVibration(isFinished = false) {
    // #region debug-point: H3 自动停止日志
    debugLog('[VIBRATE-STOP]', '振动停止', {
      isFinished,
      wasVibrating: this.data.isVibrating,
      remainingSeconds: this.data.remainingSeconds,
    })
    // #endregion
    
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.vibrateTimer) {
      clearTimeout(this.vibrateTimer)
      this.vibrateTimer = null
    }

    this.setData({
      isVibrating: false,
      remainingSeconds: 0,
      progress: 0,
      seconds: '',
    })

    if (isFinished) {
      // #region debug-point: H1 结束提示振动
      debugLog('[VIBRATE-API]', '振动结束提示：调用 wx.vibrateShort')
      wx.vibrateShort({
        type: 'light',
        success: () => {
          debugLog('[VIBRATE-API]', '结束提示振动成功')
        },
        fail: (err) => {
          debugLog('[VIBRATE-API]', '结束提示振动失败', { error: JSON.stringify(err) })
        },
      })
      // #endregion
      wx.showModal({
        title: '振动结束',
        content: '振动已完成！',
        showCancel: false,
        success: () => {},
        fail: () => {},
      })
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.isStopped = true
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.vibrateTimer) {
      clearTimeout(this.vibrateTimer)
      this.vibrateTimer = null
    }
  },
  
  // #region debug-point: 测试人员日志获取接口
  /**
   * 获取所有调试日志（供测试人员调用）
   * 使用方法：在微信开发者工具控制台输入 getCurrentPages()[0].getDebugLogs()
   * 或在真机调试时通过 vConsole 查看
   * @returns 日志数组
   */
  getDebugLogs(): string[] {
    return debugLogs.slice()
  },
  
  /**
   * 清空调试日志缓存
   * 使用方法：在微信开发者工具控制台输入 getCurrentPages()[0].clearDebugLogs()
   */
  clearDebugLogs(): void {
    debugLogs.length = 0
    console.log('[DEBUG] 日志缓存已清空')
  },
  
  /**
   * 导出调试日志为文本（方便复制）
   * 使用方法：在微信开发者工具控制台输入 getCurrentPages()[0].exportDebugLogs()
   * @returns 日志文本（换行分隔）
   */
  exportDebugLogs(): string {
    return debugLogs.join('\n')
  },
  // #endregion
})