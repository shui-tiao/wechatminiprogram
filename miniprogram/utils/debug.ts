/**
 * 调试日志模块
 * 统一管理调试模式的日志记录功能
 *
 * 使用方式：
 * ```
 * import { debugLog, isDebugMode, exportDebugLogs, clearDebugLogs } from '../../utils/debug'
 *
 * debugLog('[MY-TAG]', '消息内容', { 附加数据 })
 * ```
 */

/** 内存日志缓存 */
const logsCache: string[] = []

/**
 * 判断当前是否为调试模式
 */
export function isDebugMode(): boolean {
  return wx.getStorageSync('debugMode') === true
}

/**
 * 记录一条调试日志
 * 仅在调试模式开启时生效
 * @param tag 日志标签，如 [VIBRATE-API]
 * @param message 日志消息
 * @param data 附加数据（可选）
 */
export function debugLog(tag: string, message: string, data?: object): void {
  if (!isDebugMode()) return

  const timestamp = new Date().toISOString()
  const entry = `[${timestamp}] ${tag} ${message}${data ? ` | ${JSON.stringify(data)}` : ''}`

  // 写入微信日志管理器
  try {
    wx.getLogManager({ level: 1 }).log(entry)
  } catch {
    // 兼容不支持 getLogManager 的环境
  }

  // 写入内存缓存
  logsCache.push(entry)

  // 写入全局数据（跨页面共享）
  const app = getApp()
  if (!app.globalData.debugLogs) {
    app.globalData.debugLogs = []
  }
  app.globalData.debugLogs.push(entry)

  // 控制台输出
  console.log(entry)
}

/**
 * 获取当前缓存的日志列表
 */
export function getDebugLogs(): string[] {
  return logsCache.slice()
}

/**
 * 导出所有调试日志（用于跨页面共享或复制）
 */
export function exportDebugLogs(): string {
  const app = getApp()
  const globalLogs = (app.globalData.debugLogs || []) as string[]
  return globalLogs.join('\n')
}

/**
 * 清空调试日志缓存
 */
export function clearDebugLogs(): void {
  logsCache.length = 0
  const app = getApp()
  app.globalData.debugLogs = []
}