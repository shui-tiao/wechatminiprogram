/**
 * 振动器页面
 * 提供振动时长设置和振动强度切换功能
 */
import { ThemeManager, getSavedUiStyle } from '../../utils/theme'
import { debugLog, isDebugMode, getDebugLogs, clearDebugLogs, exportDebugLogs } from '../../utils/debug'

Page({
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
    vibrateTip: '',           // 设备不支持振动时的提示
    uiStyle: 'gradient',      // 界面风格
    containerClass: '',       // 容器额外的class
  },

  timer: null as ReturnType<typeof setInterval> | null,
  vibrateTimer: null as ReturnType<typeof setTimeout> | null,
  isStopped: false,
  themeManager: null as unknown as ThemeManager,

  onLoad() {
    // 初始化主题管理器
    this.themeManager = new ThemeManager(this, { hasProgress: true })
    this.themeManager.applyOnLoad()

    // 同步 themeColor 到 data（用于颜色重置场景）
    this.checkVibrateSupport()
  },

  onShow() {
    this.themeManager.applyOnShow()
  },

  onThemeChange(e: any) {
    this.themeManager.onSystemThemeChange(e)
  },

  checkVibrateSupport() {
    debugLog('[DEVICE-CHECK]', '开始检测设备振动支持')

    try {
      const deviceInfo = wx.getDeviceInfo()
      const platform = (deviceInfo.platform || '').toLowerCase()
      const model = deviceInfo.model || '未知设备'

      debugLog('[DEVICE-CHECK]', '设备信息获取成功', {
        platform, model, SDKVersion: wx.getAppBaseInfo().SDKVersion,
      })

      const unsupportedPlatforms = ['windows', 'mac', 'linux', 'pc']
      const isUnsupportedPlatform = unsupportedPlatforms.some(p => platform.includes(p))
      const isIPad = /ipad/i.test(model)
      const isIPod = /ipod/i.test(model)

      debugLog('[DEVICE-CHECK]', '振动支持判断结果', {
        isUnsupported: isUnsupportedPlatform || isIPad || isIPod,
        supportVibrate: !isUnsupportedPlatform && !isIPad && !isIPod,
        isIPad, isIPod, model,
      })

      this.setData({
        supportVibrate: !isUnsupportedPlatform && !isIPad && !isIPod,
        deviceModel: model,
        platform: platform,
        isXiaomi: /xiaomi|redmi|poco|mi\s*\d|^\d+[a-z]/i.test(model),
      })

      if (isIPad) {
        this.setData({ vibrateTip: '📱 当前设备为iPad，不支持振动功能' })
      } else if (isIPod) {
        this.setData({ vibrateTip: '🎵 当前设备为iPod，不支持振动功能' })
      }
    } catch (err) {
      debugLog('[DEVICE-CHECK]', '设备检测异常', { error: String(err) })
      this.setData({ supportVibrate: true, deviceModel: '未知设备' })
    }
  },

  onInput(e: any) {
    this.setData({ seconds: e.detail.value })
  },

  reuseLastTime() {
    this.setData({
      seconds: this.data.lastSeconds,
      showReuseButton: false,
    })
  },

  toggleIntensity() {
    const intensity = this.data.vibrateIntensity === 'strong' ? 'weak' : 'strong'
    this.setData({ vibrateIntensity: intensity })
  },

  startVibration() {
    const seconds = parseInt(this.data.seconds)

    debugLog('[VIBRATE-START]', '用户点击开始振动', {
      inputSeconds: this.data.seconds,
      parsedSeconds: seconds,
      intensity: this.data.vibrateIntensity,
      deviceModel: this.data.deviceModel,
    })

    if (!seconds || seconds <= 0) {
      wx.showToast({ title: '请输入有效秒数', icon: 'none' })
      debugLog('[VIBRATE-START]', '输入验证失败：无效秒数')
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

    const vibrateApi = this.data.vibrateIntensity === 'strong' ? 'wx.vibrateLong' : 'wx.vibrateShort'
    debugLog('[VIBRATE-API]', `调用 ${vibrateApi}`, { intensity: this.data.vibrateIntensity })

    if (this.data.vibrateIntensity === 'strong') {
      wx.vibrateLong({
        success: () => debugLog('[VIBRATE-API]', 'wx.vibrateLong 成功'),
        fail: (err) => debugLog('[VIBRATE-API]', 'wx.vibrateLong 失败', { error: JSON.stringify(err) }),
      })
    } else {
      wx.vibrateShort({
        type: 'light',
        success: () => debugLog('[VIBRATE-API]', 'wx.vibrateShort 成功'),
        fail: (err) => debugLog('[VIBRATE-API]', 'wx.vibrateShort 失败', { error: JSON.stringify(err) }),
      })
    }

    this.startTimers(seconds)
  },

  startTimers(totalSeconds: number) {
    let remaining = totalSeconds
    const intensity = this.data.vibrateIntensity
    let loopCount = 0

    debugLog('[VIBRATE-LOOP]', '启动振动循环定时器', {
      totalSeconds, intensity,
      interval: intensity === 'strong' ? 350 : 150,
    })

    const vibrateLoop = () => {
      if (this.isStopped) {
        debugLog('[VIBRATE-LOOP]', '振动循环被中断', { loopCount, reason: 'isStopped=true' })
        return
      }

      loopCount++
      const vibrateApi = intensity === 'strong' ? 'wx.vibrateLong' : 'wx.vibrateShort'

      debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} 调用 ${vibrateApi}`, { remainingSeconds: remaining, loopCount })

      if (intensity === 'strong') {
        wx.vibrateLong({
          success: () => debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateLong 成功`),
          fail: (err) => debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateLong 失败`, { error: JSON.stringify(err), loopCount }),
        })
        this.vibrateTimer = setTimeout(vibrateLoop, 350) as unknown as ReturnType<typeof setInterval>
      } else {
        wx.vibrateShort({
          type: 'light',
          success: () => debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateShort 成功`),
          fail: (err) => debugLog('[VIBRATE-LOOP]', `循环 #${loopCount} wx.vibrateShort 失败`, { error: JSON.stringify(err), loopCount }),
        })
        this.vibrateTimer = setTimeout(vibrateLoop, 150) as unknown as ReturnType<typeof setInterval>
      }
    }
    vibrateLoop()

    this.timer = setInterval(() => {
      if (this.isStopped) return
      remaining--

      if (remaining <= 0) {
        debugLog('[VIBRATE-LOOP]', '倒计时结束，自动停止振动', { totalLoopCount: loopCount })
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

  manualStop() {
    debugLog('[VIBRATE-STOP]', '用户手动停止振动', {
      wasVibrating: this.data.isVibrating,
      remainingSeconds: this.data.remainingSeconds,
    })

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

    debugLog('[VIBRATE-STOP]', '振动已手动停止')
  },

  stopVibration(isFinished = false) {
    debugLog('[VIBRATE-STOP]', '振动停止', {
      isFinished,
      wasVibrating: this.data.isVibrating,
      remainingSeconds: this.data.remainingSeconds,
    })

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
      debugLog('[VIBRATE-API]', '振动结束提示：调用 wx.vibrateShort')
      wx.vibrateShort({
        type: 'light',
        success: () => debugLog('[VIBRATE-API]', '结束提示振动成功'),
        fail: (err) => debugLog('[VIBRATE-API]', '结束提示振动失败', { error: JSON.stringify(err) }),
      })
      wx.showModal({
        title: '振动结束',
        content: '振动已完成！',
        showCancel: false,
      })
    }
  },

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

  // 测试人员日志获取接口（通过 vConsole 调用）
  getDebugLogs(): string[] { return getDebugLogs() },
  clearDebugLogs(): void { clearDebugLogs() },
  exportDebugLogs(): string { return exportDebugLogs() },
})