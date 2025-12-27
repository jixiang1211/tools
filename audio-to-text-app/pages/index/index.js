/**
 * 首页 - 音频转文字
 * 核心功能：
 * 1. 开始录音
 * 2. 停止录音
 * 3. 显示录音状态
 * 4. 上传到后端
 */

const request = require('../../utils/request')

Page({
  data: {
    isRecording: false,           // 是否正在录音
    recordingTime: 0,             // 录音时长（秒）
    audioPath: '',                // 录音文件路径
    isLoading: false,             // 是否在加载（识别中）
  },

  onLoad() {
    // 页面加载时初始化录音管理器
    this.initRecorder()
  },

  /**
   * 初始化录音管理器
   * 这个函数在页面加载时执行一次，设置好录音相关的事件监听
   */
  initRecorder() {
    // 获取全局的录音管理器对象
    this.recorder = wx.getRecorderManager()

    // 监听录音停止事件
    // 当用户点击"停止录音"后，这个事件会触发
    this.recorder.onStop((result) => {
      console.log('录音已停止')
      // result.tempFilePath 是微信小程序自动生成的临时文件路径
      // 这个路径只在当前会话有效，重启后失效
      this.setData({
        audioPath: result.tempFilePath,
        isRecording: false,
        recordingTime: 0
      })

      // 自动停止计时器
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
      }
    })

    // 监听录音出错事件
    this.recorder.onError((err) => {
      console.error('录音出错:', err)
      wx.showToast({
        title: '录音失败',
        icon: 'error'
      })
      this.setData({
        isRecording: false
      })
    })
  },

  /**
   * 开始录音
   * 当用户点击"开始录音"按钮时触发
   */
  startRecording() {
    // 检查是否已在录音
    if (this.data.isRecording) {
      return
    }

    // 重置录音数据
    this.setData({
      audioPath: '',
      recordingTime: 0
    })

    // 触觉反馈 - 开始录音
    wx.vibrateShort({ type: 'light' })

    // 调用微信API开始录音
    this.recorder.start({
      duration: 60000,              // 最长录音时长：60秒
      sampleRate: 16000,            // 采样率：16000Hz（标准人声）
      numberOfChannels: 1,          // 单声道（减小文件大小）
      encodeBitRate: 96000,         // 比特率：96kbps（平衡质量和大小）
      audioSource: 'auto'           // 音频来源：自动选择
    })

    // 设置UI状态
    this.setData({
      isRecording: true
    })

    // 启动计时器，每秒更新录音时长显示
    let seconds = 0
    this.recordingTimer = setInterval(() => {
      seconds++
      this.setData({
        recordingTime: seconds
      })

      // 如果超过60秒，自动停止（微信限制）
      if (seconds >= 60) {
        this.stopRecording()
      }
    }, 1000)

    wx.showToast({
      title: '开始录音',
      icon: 'none',
      duration: 1000
    })
  },

  /**
   * 停止录音
   * 当用户点击"停止录音"按钮时触发
   */
  stopRecording() {
    if (!this.data.isRecording) {
      return // 如果没有在录音，不操作
    }

    // 触觉反馈 - 停止录音
    wx.vibrateShort({ type: 'light' })

    // 调用微信API停止录音
    this.recorder.stop()

    // 停止计时器
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer)
    }
  },

  /**
   * 上传音频并识别
   * 当用户点击"识别文字"按钮时触发
   */
  async recognizeAudio() {
    // 检查是否有录音
    if (!this.data.audioPath) {
      wx.showToast({
        title: '请先录音',
        icon: 'error'
      })
      return
    }

    // 检查是否已在加载
    if (this.data.isLoading) {
      return
    }

    try {
      this.setData({ isLoading: true })

      // 使用 wx.showLoading 显示加载动画（比 UI 状态指示更明显）
      wx.showLoading({
        title: '正在识别...',
        mask: true
      })

      // 第1步：上传音频，获取 TaskId
      console.log('📤 开始上传音频文件...')
      const taskId = await request.uploadAudio(this.data.audioPath)
      console.log('✅ 上传成功，TaskId:', taskId)

      // 第2步：轮询查询识别结果
      console.log('⏳ 开始轮询识别结果...')
      const recognizedText = await request.pollTaskResult(taskId, (progress) => {
        // 进度回调
        console.log(`轮询中... 状态: ${progress.status}, 次数: ${progress.attempts}`)
      })

      console.log('✅ 识别完成:', recognizedText)

      // 隐藏加载动画
      wx.hideLoading()

      // 触觉反馈 - 识别完成
      wx.vibrateShort({ type: 'light' })

      // 处理识别结果：去掉时间戳，只保留文本部分
      // 原格式：[0:0.000,0:1.800]  FRY.
      // 处理后：FRY.
      const cleanText = recognizedText.replace(/^\[\d+:\d+\.\d+,\d+:\d+\.\d+\]\s+/, '').trim()

      // 第3步：跳转到结果页面
      wx.navigateTo({
        url: `/pages/result/result?text=${encodeURIComponent(cleanText)}`
      })
    } catch (error) {
      // 隐藏加载动画
      wx.hideLoading()

      // 如果识别失败，显示错误提示
      console.error('❌ 识别失败:', error)
      wx.showToast({
        title: error.message || '识别失败，请重试',
        icon: 'error'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 页面卸载时的清理工作
   */
  onUnload() {
    // 停止录音（如果正在进行）
    if (this.data.isRecording) {
      this.recorder.stop()
    }

    // 清理计时器
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer)
    }
  }
})
