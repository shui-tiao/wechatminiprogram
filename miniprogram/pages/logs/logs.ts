/**
 * 日志列表页面组件
 * 展示小程序的启动日志记录，显示每次启动的时间
 * 数据来源：wx.setStorageSync('logs', ...) 存储的时间戳列表
 */
import { formatTime } from '../../utils/util'

Component({
  /**
   * 组件的初始数据
   */
  data: {
    /**
     * 日志列表
     * 元素格式：{ date: "YYYY/MM/DD HH:mm:ss" 格式的日期字符串, timeStamp: 原始时间戳 }
     */
    logs: [] as Array<{ date: string; timeStamp: number }>,
  },
  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件实例进入页面节点树时触发
     * 从本地存储中读取日志列表，将时间戳格式化为可读的日期字符串
     */
    attached() {
      this.setData({
        logs: (wx.getStorageSync('logs') || []).map((log: string) => {
          return {
            date: formatTime(new Date(log)),
            timeStamp: log
          }
        }),
      })
    }
  },
})