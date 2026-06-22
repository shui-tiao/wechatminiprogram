/**
 * 主题管理模块
 * 统一管理小程序的界面风格主题系统
 *
 * 支持三种风格：
 * - gradient：随机渐变风格（默认），每次进入页面生成随机 HSL 渐变
 * - tech：固定科技风格，使用深色背景 + 固定配色
 * - outline：简洁边框风格，无填充色，仅用色彩边框勾勒
 *
 * 使用方式：
 * ```
 * import { ThemeManager } from '../../utils/theme'
 *
 * // 在 Page 中创建管理器实例
 * private theme: ThemeManager
 *
 * onLoad() {
 *   this.theme = new ThemeManager(this)
 *   this.theme.applyOnLoad()
 * }
 * ```
 */

// ========== 类型定义 ==========

/** 界面风格选项 */
export type UiStyle = 'gradient' | 'tech' | 'outline'

/** 主题配置对象，包含页面渲染需要的所有颜色值 */
export interface ThemeConfig {
  themeColor: string    // 主题渐变色1 (HSL)
  themeColor2: string   // 主题渐变色2 (HSL)
}

/** 页面渲染数据，需要 setData 到页面的字段 */
export interface ThemeData {
  textColor: string
  borderColor: string
  containerBg: string
  btnBg: string
  uiStyle: UiStyle
  containerClass: string
}

// 如果页面需要 progressBg，请使用有 progressBg 的版本
export interface ThemeDataWithProgress extends ThemeData {
  progressBg: string
}

// ========== 科技风固定色值 ==========

const TECH_COLORS = {
  navBg: '#1a1a2e',
  navText: '#ffffff',
  textColor: '#e0e0e0',
  containerBg: '#0a0a0a',
  btnBg: 'linear-gradient(135deg, #ff6b81 0%, #0f3460 100%)',
  progressBg: 'linear-gradient(90deg, #ff6b81 0%, #0f3460 100%)',
}

// ========== 边框风格 - 亮色/深色基础值 ==========

const OUTLINE_LIGHT_BG = '#f8f8f8'     // 亮色模式容器背景（极浅灰）
const OUTLINE_DARK_BG = '#000000'      // 深色模式容器背景

// ========== 深色模式固定色值 ==========

const DARK_COLORS = {
  textColor: '#ffffff',
  containerBg: '#000000',
  btnBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  progressBg: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
}

// ========== 工具函数 ==========

/**
 * 将 HSL 颜色值转换为 HEX 字符串
 * @param h 色相 (0-360)
 * @param s 饱和度 (0-100)
 * @param l 明度 (0-100)
 * @returns HEX 颜色字符串，如 "#667eea"
 */
export function hslToHex(h: number, s: number, l: number): string {
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

/**
 * 从 HSL 字符串中解析出色相、饱和度、明度数值
 */
export function parseHsl(hsl: string): { h: number; s: number; l: number } | null {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return null
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) }
}

/**
 * 生成一组随机主题色
 * 色相随机，饱和度高，明度适中
 */
export function generateRandomThemeColors(): ThemeConfig {
  const hue = Math.floor(Math.random() * 360)
  const saturation = Math.floor(Math.random() * 30) + 60
  const lightness1 = Math.floor(Math.random() * 15) + 45
  const lightness2 = Math.floor(Math.random() * 15) + 30
  return {
    themeColor: `hsl(${hue}, ${saturation}%, ${lightness1}%)`,
    themeColor2: `hsl(${hue}, ${saturation}%, ${lightness2}%)`,
  }
}

/**
 * 读取用户保存的界面风格
 */
export function getSavedUiStyle(): UiStyle {
  const saved = wx.getStorageSync('uiStyle')
  if (saved === 'gradient' || saved === 'tech' || saved === 'outline') {
    return saved
  }
  return 'gradient'
}

/**
 * 获取颜色对应的 HEX（不持久化，纯计算）
 */
function getThemeHex(themeColor: string): string | null {
  const parsed = parseHsl(themeColor)
  if (!parsed) return null
  return hslToHex(parsed.h, parsed.s, parsed.l)
}

// ========== 管理器类 ==========

/**
 * 主题管理器
 * 封装了主题初始化和切换的全部逻辑，每个 Page 实例化一个
 *
 * @example
 * ```
 * const theme = new ThemeManager(this, { hasProgress: true })
 * theme.applyOnLoad()
 * // 在 onShow 中：
 * theme.applyOnShow()
 * // 在 onThemeChange 中：
 * theme.onSystemThemeChange(e)
 * // 如果页面需要 progressBg，获取 data 时使用：
 * theme.getThemeData() // 返回 ThemeDataWithProgress
 * ```
 */
export class ThemeManager {
  private page: WechatMiniprogram.Page.Instance<{}, {}>
  private hasProgress: boolean
  private themeConfig: ThemeConfig

  constructor(
    page: WechatMiniprogram.Page.Instance<{}, {}>,
    options?: { hasProgress?: boolean },
  ) {
    this.page = page
    this.hasProgress = options?.hasProgress ?? false
    this.themeConfig = generateRandomThemeColors()
  }

  /**
   * onLoad 时调用：读取风格设置、生成随机颜色、应用主题
   */
  applyOnLoad(): void {
    const uiStyle = getSavedUiStyle()
    this.themeConfig = generateRandomThemeColors()
    this.page.setData({
      themeColor: this.themeConfig.themeColor,
      themeColor2: this.themeConfig.themeColor2,
      uiStyle,
      containerClass: this.getContainerClass(uiStyle),
      ...this.buildDisplayData(uiStyle),
    })
  }

  /**
   * 获取容器额外 CSS class
   */
  private getContainerClass(uiStyle: UiStyle): string {
    if (uiStyle === 'tech') return 'tech-style'
    if (uiStyle === 'outline') return 'outline-style'
    return ''
  }

  /**
   * onShow 时调用：重新读取风格设置、根据系统主题更新显示
   */
  applyOnShow(): void {
    const res = wx.getAppBaseInfo()
    const isDark = res.theme === 'dark'
    const uiStyle = getSavedUiStyle()

    this.page.setData({
      uiStyle,
      containerClass: this.getContainerClass(uiStyle),
    })

    this.applyTheme(isDark, uiStyle)
  }

  /**
   * onThemeChange 时调用
   */
  onSystemThemeChange(e: any): void {
    const isDark = e.theme === 'dark'
    this.applyTheme(isDark, getSavedUiStyle())
  }

  /**
   * 主动切换风格（配合设置页面使用）
   */
  switchStyle(uiStyle: UiStyle): void {
    const res = wx.getAppBaseInfo()
    const isDark = res.theme === 'dark'
    this.applyTheme(isDark, uiStyle)
  }

  /**
   * 获取当前主题数据（供页面在 onLoad 后使用）
   */
  getThemeData(): ThemeData | ThemeDataWithProgress {
    const uiStyle = getSavedUiStyle()
    return {
      uiStyle,
      containerClass: this.getContainerClass(uiStyle),
      ...this.buildDisplayData(uiStyle),
    } as ThemeData | ThemeDataWithProgress
  }

  // ========== 内部方法 ==========

  /**
   * 根据系统主题和界面风格，设置页面颜色和导航栏
   */
  private applyTheme(isDark: boolean, uiStyle: UiStyle): void {
    if (uiStyle === 'tech') {
      this.applyTechStyle()
    } else if (uiStyle === 'outline') {
      this.applyOutlineStyle(isDark)
    } else if (isDark) {
      this.applyDarkStyle()
    } else {
      this.applyLightStyle()
    }
  }

  private applyTechStyle(): void {
    wx.setNavigationBarColor({
      frontColor: TECH_COLORS.navText,
      backgroundColor: TECH_COLORS.navBg,
    })
    this.page.setData(this.buildTechData())
  }

  private applyDarkStyle(): void {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#000000',
    })
    this.page.setData(this.buildDarkData())
  }

  private applyLightStyle(): void {
    const { themeColor, themeColor2 } = this.themeConfig
    const parsed = parseHsl(themeColor)
    let navTextColor = '#000000'
    let navBgColor = '#ffffff'
    
    if (parsed) {
      navTextColor = parsed.l < 50 ? '#ffffff' : '#000000'
      navBgColor = hslToHex(parsed.h, parsed.s, parsed.l)
    }
    
    wx.setNavigationBarColor({
      frontColor: navTextColor,
      backgroundColor: navBgColor,
    })
    
    this.page.setData(this.buildLightData(themeColor, themeColor2, parsed))
  }

  /** ====== 边框风格 ====== */

  private applyOutlineStyle(isDark: boolean): void {
    const { themeColor } = this.themeConfig
    const hex = getThemeHex(themeColor) || '#667eea'

    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#000000' : '#ffffff',
    })

    this.page.setData(this.buildOutlineData(isDark, hex))
  }

  /**
   * 构建当前风格的显示数据（不写导航栏，只返回 data）
   */
  private buildDisplayData(uiStyle: UiStyle): Record<string, any> {
    if (uiStyle === 'tech') return this.buildTechData()
    if (uiStyle === 'outline') {
      const isDark = wx.getAppBaseInfo().theme === 'dark'
      const hex = getThemeHex(this.themeConfig.themeColor) || '#667eea'
      return this.buildOutlineData(isDark, hex)
    }
    const isDark = wx.getAppBaseInfo().theme === 'dark'
    if (isDark) return this.buildDarkData()
    return this.buildLightData(
      this.themeConfig.themeColor,
      this.themeConfig.themeColor2,
      parseHsl(this.themeConfig.themeColor),
    )
  }

  private buildTechData(): Record<string, any> {
    const data: Record<string, any> = {
      textColor: TECH_COLORS.textColor,
      borderColor: '#e94560',
      containerBg: TECH_COLORS.containerBg,
      btnBg: TECH_COLORS.btnBg,
    }
    if (this.hasProgress) {
      data.progressBg = TECH_COLORS.progressBg
    }
    return data
  }

  private buildDarkData(): Record<string, any> {
    const data: Record<string, any> = {
      textColor: DARK_COLORS.textColor,
      borderColor: '#667eea',
      containerBg: DARK_COLORS.containerBg,
      btnBg: DARK_COLORS.btnBg,
    }
    if (this.hasProgress) {
      data.progressBg = DARK_COLORS.progressBg
    }
    return data
  }

  private buildLightData(
    color1: string,
    color2: string,
    parsed: { h: number; s: number; l: number } | null,
  ): Record<string, any> {
    const textColor = parsed && parsed.l < 50 ? '#ffffff' : '#333333'
    const borderColor = parsed ? hslToHex(parsed.h, parsed.s, parsed.l) : '#667eea'
    const data: Record<string, any> = {
      textColor,
      borderColor,
      containerBg: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
      btnBg: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    }
    if (this.hasProgress) {
      data.progressBg = `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`
    }
    return data
  }

  /** ====== 边框风格的显示数据构建 ====== */

  /**
   * 边框风格：容器背景为纯色，卡片用主题色边框，按钮用主题色边框
   */
  private buildOutlineData(isDark: boolean, hex: string): Record<string, any> {
    const data: Record<string, any> = {
      textColor: isDark ? '#ffffff' : '#333333',
      borderColor: hex,
      containerBg: isDark ? OUTLINE_DARK_BG : OUTLINE_LIGHT_BG,
      btnBg: `outline:${hex}`,
    }
    if (this.hasProgress) {
      data.progressBg = `outline:${hex}`
    }
    return data
  }
}