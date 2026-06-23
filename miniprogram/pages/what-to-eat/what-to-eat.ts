/**
 * 吃什么页面
 * 随机决定今天吃什么
 */
import { ThemeManager } from '../../utils/theme'
import { debugLog } from '../../utils/debug'

interface FoodItem {
  name: string
  emoji: string
}

Page({
  data: {
    themeColor: '#f093fb',
    themeColor2: '#f5576c',
    textColor: '#ffffff',
    containerBg: '',
    btnBg: '',
    containerClass: '',
    borderColor: '',
    uiStyle: 'gradient',
    currentFood: null as FoodItem | null,
    isRolling: false,
    foodList: [
      { name: '火锅', emoji: '🍲' },
      { name: '烧烤', emoji: '🍖' },
      { name: '披萨', emoji: '🍕' },
      { name: '汉堡', emoji: '🍔' },
      { name: '面条', emoji: '🍜' },
      { name: '饺子', emoji: '🥟' },
      { name: '寿司', emoji: '🍣' },
      { name: '炸鸡', emoji: '🍗' },
      { name: '沙拉', emoji: '🥗' },
      { name: '米饭', emoji: '🍚' },
      { name: '串串', emoji: '🍢' },
      { name: '小龙虾', emoji: '🦞' },
      { name: '蛋糕', emoji: '🍰' },
      { name: '奶茶', emoji: '🧋' },
      { name: '咖啡', emoji: '☕' },
    ] as FoodItem[],
  },

  themeManager: null as unknown as ThemeManager,

  onLoad() {
    this.themeManager = new ThemeManager(this)
    this.themeManager.applyOnLoad()
  },

  onShow() {
    this.themeManager.applyOnShow()
  },

  onThemeChange(e: any) {
    this.themeManager.onSystemThemeChange(e)
  },

  rollFood() {
    if (this.data.isRolling) return

    this.setData({ isRolling: true })

    let rollCount = 0
    const maxRolls = 15
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.data.foodList.length)
      this.setData({
        currentFood: this.data.foodList[randomIndex],
      })
      rollCount++

      if (rollCount >= maxRolls) {
        clearInterval(interval)
        this.setData({ isRolling: false })
        debugLog('[WHAT-TO-EAT]', '最终选择:', this.data.currentFood)
      }
    }, 100)
  },

  onShareAppMessage() {
    return {
      title: '今天吃什么？',
      path: '/pages/what-to-eat/what-to-eat',
    }
  },
})