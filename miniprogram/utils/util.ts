/**
 * 将 Date 对象格式化为 "YYYY/MM/DD HH:mm:ss" 字符串
 * @param date - 要格式化的日期对象
 * @returns 格式化后的日期时间字符串，如 "2026/06/17 16:59:30"
 */
export const formatTime = (date: Date) => {
  const year = date.getFullYear()        // 年份
  const month = date.getMonth() + 1      // 月份（getMonth 返回 0-11，需 +1）
  const day = date.getDate()             // 日期
  const hour = date.getHours()           // 小时
  const minute = date.getMinutes()       // 分钟
  const second = date.getSeconds()       // 秒

  return (
    // 日期部分：年/月/日，不足两位补 0
    [year, month, day].map(formatNumber).join('/') +
    ' ' +  // 日期与时间之间的空格
    // 时间部分：时:分:秒，不足两位补 0
    [hour, minute, second].map(formatNumber).join(':')
  )
}

/**
 * 数字补零：小于 10 的数字前面补 "0"
 * @param n - 要格式化的数字
 * @returns 补零后的字符串，如 "05"
 * @example formatNumber(5)  → "05"
 * @example formatNumber(12) → "12"
 */
const formatNumber = (n: number) => {
  const s = n.toString()
  // s[1] 存在说明是两位数，直接返回；否则补 "0"
  return s[1] ? s : '0' + s
}
