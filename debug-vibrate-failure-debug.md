# Debug Session: vibrate-failure-debug

## 状态
[OPEN]

## 问题描述
振动功能在某些手机系统上会失效，需要收集运行时证据定位根因。

## 假设列表

| # | 假设 | 观察点 | 状态 |
|---|---|---|---|
| H1 | 振动 API 调用失败（wx.vibrateLong/wx.vibrateShort 返回错误） | `[VIBRATE-API]` 日志中的 success/fail 回调 | ❌ **已排除** - API 全部返回成功 |
| H2 | 设备平台检测逻辑错误，导致某些设备被误判为不支持振动 | `[DEVICE-CHECK]` 日志中的 platform/model 判断结果 | ❌ **已排除** - 判断逻辑正确 |
| H3 | 振动定时器循环在某些系统上异常中断 | `[VIBRATE-LOOP]` 日志中的 loopCount 和中断时机 | ❌ **已排除** - 循环正常执行 |
| H4 | 振动权限在某些系统上被拒绝 | `[VIBRATE-API]` 日志中的 fail 回调错误信息 | ❌ **已排除** - 无权限错误 |
| H5 | 微信版本过低，不支持某些振动 API | `[DEVICE-CHECK]` 日志中的 SDKVersion | ❌ **已排除** - 版本正常 |

## 根因确认

**根因**：小米手机系统设置中的「系统触感」开关被关闭，导致振动功能失效。

**复现设备**：24122RKC7C (Android)

## 修复方案

添加小米设备检测，当检测到小米设备时，在页面底部显示系统触感设置提示：

- 仅 Android + 小米设备显示提示
- 提示文字不显眼，使用弱化颜色
- 不使用弹窗，底部以小字显示

**修改文件**：
- `vibrator.ts`: 添加 `platform`、`isXiaomi` 数据字段和检测逻辑
- `vibrator.wxml`: 添加条件渲染的提示文字
- `vibrator.wxss`: 添加提示文字样式

## 状态
[CLOSED]

## 进度记录

### Step 1: 初始化调试环境
- 时间: 2026-06-18
- 操作: 创建调试文件，列出假设

### Step 2: 插桩完成
- 时间: 2026-06-18
- 操作: 在以下关键位置添加调试日志：
  - `checkVibrateSupport`: 设备检测日志 `[DEVICE-CHECK]`
  - `startVibration`: 振动启动日志 `[VIBRATE-START]`
  - `vibrateLoop`: 振动循环日志 `[VIBRATE-LOOP]`
  - `stopVibration/manualStop`: 停止日志 `[VIBRATE-STOP]`
  - 所有 `wx.vibrateLong/wx.vibrateShort` 调用: API 日志 `[VIBRATE-API]`

## 测试人员操作指南

### 方式一：微信开发者工具控制台（推荐）

1. 在微信开发者工具中打开小程序
2. 进入振动器页面
3. 点击"开始振动"按钮
4. 打开控制台（Console 标签页）
5. 查看实时输出的日志（带 `[VIBRATE-*]` 标签）
6. 复制日志内容反馈给开发人员

### 方式二：真机调试 + vConsole

1. 在真机上打开小程序
2. 进入振动器页面
3. 点击右上角"..."打开调试面板
4. 启用 vConsole（如果可用）
5. 点击"开始振动"按钮
6. 在 vConsole 的 Log 标签页查看日志
7. 复制日志内容反馈给开发人员

### 方式三：调用页面方法获取日志

在微信开发者工具控制台输入以下命令：

```javascript
// 获取所有日志（数组格式）
getCurrentPages()[0].getDebugLogs()

// 导出日志为文本（方便复制）
getCurrentPages()[0].exportDebugLogs()

// 清空日志缓存（重新测试前使用）
getCurrentPages()[0].clearDebugLogs()
```

### 日志标签说明

| 标签 | 含义 |
|---|---|
| `[DEVICE-CHECK]` | 设备检测相关日志 |
| `[VIBRATE-START]` | 振动启动相关日志 |
| `[VIBRATE-API]` | 振动 API 调用结果（成功/失败） |
| `[VIBRATE-LOOP]` | 振动循环执行日志 |
| `[VIBRATE-STOP]` | 振动停止相关日志 |

### 需要收集的关键信息

测试人员复现问题后，请提供以下日志内容：

1. **设备信息日志**（`[DEVICE-CHECK]`）：
   - platform（平台）
   - model（设备型号）
   - SDKVersion（微信版本）
   - supportVibrate（是否支持振动）

2. **振动 API 调用日志**（`[VIBRATE-API]`）：
   - 是否有 `失败` 日志
   - 失败时的 error 信息

3. **振动循环日志**（`[VIBRATE-LOOP]`）：
   - loopCount（循环次数）
   - 是否有循环中断日志
   - 中断时的 remainingSeconds

## 下一步
等待测试人员反馈日志数据，分析证据并验证假设。