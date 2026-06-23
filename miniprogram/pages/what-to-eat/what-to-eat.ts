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
      // 中式
      { name: '火锅', emoji: '🍲' },
      { name: '烧烤', emoji: '🍖' },
      { name: '面条', emoji: '🍜' },
      { name: '饺子', emoji: '🥟' },
      { name: '米饭炒菜', emoji: '🍚' },
      { name: '串串', emoji: '🍢' },
      { name: '小龙虾', emoji: '🦞' },
      { name: '麻辣烫', emoji: '🫕' },
      { name: '螺蛳粉', emoji: '🍜' },
      { name: '炒饭', emoji: '🍚' },
      { name: '煎饼果子', emoji: '🫓' },
      { name: '小笼包', emoji: '🥟' },
      { name: '红烧肉', emoji: '🥩' },
      { name: '糖醋排骨', emoji: '🍖' },
      { name: '宫保鸡丁', emoji: '🍗' },
      { name: '水煮鱼', emoji: '🐟' },
      { name: '酸菜鱼', emoji: '🐟' },
      { name: '凉皮', emoji: '🥙' },
      { name: '盖浇饭', emoji: '🍛' },
      { name: '干锅', emoji: '🍲' },
      { name: '砂锅', emoji: '🍲' },
      { name: '烤鱼', emoji: '🐟' },
      { name: '铁板烧', emoji: '🥩' },
      { name: '手抓饼', emoji: '🫓' },
      { name: '牛肉面', emoji: '🍜' },
      { name: '炒米粉', emoji: '🍝' },
      { name: '生煎包', emoji: '🥟' },
      // 西式
      { name: '披萨', emoji: '🍕' },
      { name: '汉堡', emoji: '🍔' },
      { name: '炸鸡', emoji: '🍗' },
      { name: '牛排', emoji: '🥩' },
      { name: '意面', emoji: '�' },
      { name: '三明治', emoji: '�' },
      { name: '墨西哥卷饼', emoji: '🌯' },
      { name: '炸鱼薯条', emoji: '🐟' },
      { name: '热狗', emoji: '🌭' },
      // 日韩东南亚
      { name: '寿司', emoji: '🍣' },
      { name: '拉面', emoji: '�' },
      { name: '咖喱饭', emoji: '🍛' },
      { name: '韩式拌饭', emoji: '🍚' },
      { name: '部队锅', emoji: '🍲' },
      { name: '石锅拌饭', emoji: '🍲' },
      { name: '炸猪排', emoji: '🥩' },
      { name: '越南粉', emoji: '�' },
      { name: '冬阴功', emoji: '�' },
      // 轻食
      { name: '沙拉', emoji: '🥗' },
      { name: '水果捞', emoji: '🍓' },
      // 小吃甜品饮品
      { name: '蛋糕', emoji: '🍰' },
      { name: '奶茶', emoji: '🧋' },
      { name: '咖啡', emoji: '☕' },
      { name: '烤红薯', emoji: '🍠' },
      { name: '炸年糕', emoji: '🍡' },
      { name: '章鱼小丸子', emoji: '🐙' },
      { name: '鸡蛋仔', emoji: '🧇' },
      
      { name: '不吃减肥', emoji: '💪' },
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
        debugLog('[WHAT-TO-EAT]', '最终选择:', this.data.currentFood as FoodItem)
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