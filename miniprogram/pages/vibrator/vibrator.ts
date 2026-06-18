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
    try {
      const deviceInfo = wx.getDeviceInfo()
      const platform = (deviceInfo.platform || '').toLowerCase()
      const model = deviceInfo.model || '未知设备'

      const unsupportedPlatforms = ['windows', 'mac', 'linux', 'pc']
      const isUnsupported = unsupportedPlatforms.some(p => platform.includes(p))

      this.setData({
        supportVibrate: !isUnsupported,
        deviceModel: model,
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
    } catch {
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
    if (!seconds || seconds <= 0) {
      wx.showToast({
        title: '请输入有效秒数',
        icon: 'none',
      })

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

    if (this.data.vibrateIntensity === 'strong') {
      wx.vibrateLong({
        success: () => {},
        fail: () => {},
      })
    } else {
      wx.vibrateShort({
        type: 'light',
        success: () => {},
        fail: () => {},
      })
    }
    this.startTimers(seconds)
  },

  /**
   * 启动倒计时和振动循环定时器
   * @param totalSeconds 总秒数
   */
  startTimers(totalSeconds: number) {
    let remaining = totalSeconds
    const intensity = this.data.vibrateIntensity

    /**
     * 振动循环函数
     */
    const vibrateLoop = () => {
      if (this.isStopped) return
      if (intensity === 'strong') {
        wx.vibrateLong({
          success: () => {},
          fail: () => {},
        })
        this.vibrateTimer = setTimeout(vibrateLoop, 350) as unknown as ReturnType<typeof setInterval>
      } else {
        wx.vibrateShort({
          type: 'light',
          success: () => {},
          fail: () => {},
        })
        this.vibrateTimer = setTimeout(vibrateLoop, 150) as unknown as ReturnType<typeof setInterval>
      }
    }
    vibrateLoop()

    // 每秒更新倒计时
    this.timer = setInterval(() => {
      if (this.isStopped) return
      remaining--

      if (remaining <= 0) {
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
  },

  /**
   * 停止振动
   * @param isFinished 是否正常完成
   */
  stopVibration(isFinished = false) {
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
      wx.vibrateShort({
        type: 'light',
        success: () => {},
        fail: () => {},
      })
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
})