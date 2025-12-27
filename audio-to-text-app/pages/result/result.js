/**
   * 结果页面 - 显示音频识别结果
   * 功能：
   * 1. 从首页接收识别的文字
   * 2. 显示识别结果
   * 3. 支持复制、分享等操作
   * 4. 翻译功能
   */

  const request = require('../../utils/request')

  Page({
    data: {
      recognizedText: '',           // 识别的文字
      copied: false,                // 是否已复制
      translatedText: '',           // 翻译后的文字
      translating: false,           // 是否正在翻译
      selectedVoiceType: 0,         // 选中的语音类型（0=女性，1=男性）
      speaking: false,              // 是否正在播放
      currentAudioPath: ''          // 当前音频文件路径
    },

    // 音频上下文（用于播放音频）
    audioContext: null,

    onLoad(options) {
      if (options.text) {
        const decodedText = decodeURIComponent(options.text)
        this.setData({
          recognizedText: decodedText
        })
      }

      // 初始化音频上下文
      this.audioContext = wx.createInnerAudioContext()
      console.log('✅ 音频上下文已初始化')
    },

    onUnload() {
      // 页面卸载时销毁音频上下文
      if (this.audioContext) {
        this.audioContext.destroy()
      }
    },

    /**
     * 复制文字到剪贴板
     */
    copyText() {
      wx.setClipboardData({
        data: this.data.recognizedText,
        success: () => {
          // 触觉反馈 - 复制成功
          wx.vibrateShort({ type: 'light' })

          this.setData({ copied: true })

          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success',
            duration: 1500
          })

          setTimeout(() => {
            this.setData({ copied: false })
          }, 1500)
        },
        fail: () => {
          wx.showToast({
            title: '复制失败',
            icon: 'error'
          })
        }
      })
    },

    /**
     * 翻译文本
     */
    async translateText() {
      if (this.data.translating) {
        return
      }

      try {
        this.setData({ translating: true })

        // 显示加载动画
        wx.showLoading({
          title: '翻译中...',
          mask: true
        })

        console.log('🔄 开始翻译...')

        const translatedText = await request.translateText(
          this.data.recognizedText,
          'zh-HK'
        )

        // 隐藏加载动画
        wx.hideLoading()

        console.log('✅ 翻译成功:', translatedText)

        this.setData({
          translatedText: translatedText,
          translating: false
        })

        wx.showToast({
          title: '翻译成功',
          icon: 'success',
          duration: 1500
        })

      } catch (error) {
        // 隐藏加载动画
        wx.hideLoading()

        console.error('❌ 翻译失败:', error)
        this.setData({ translating: false })

        wx.showModal({
          title: '翻译失败',
          content: error.message || '翻译服务暂时不可用，请稍后重试',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    },

    /**
     * 点击"更多"菜单中的"转发"时触发
     */
    onShareAppMessage() {
      return {
        title: '语音转文字助手',
        path: '/pages/index/index',
        imageUrl: '/assets/icons/share.png'
      }
    },

    /**
     * 分享到朋友圈
     */
    onShareTimeline() {
      return {
        title: '我用语音转文字助手转出了：' + this.data.recognizedText
      }
    },

    /**
     * 翻译成粤语
     */
    async translateToCantonese() {
      if (this.data.translating) {
        return
      }

      try {
        this.setData({ translating: true })

        // 显示加载动画
        wx.showLoading({
          title: '翻译中...',
          mask: true
        })

        console.log('🌐 开始翻译...')

        const translatedText = await request.translateText(
          this.data.recognizedText,
          'yue'  // 粤语
        )

        // 隐藏加载动画
        wx.hideLoading()

        console.log('✅ 翻译成功:', translatedText)

        // 触觉反馈 - 翻译成功
        wx.vibrateShort({ type: 'light' })

        this.setData({
          translatedText: translatedText,
          translating: false
        })

        wx.showToast({
          title: '翻译成功',
          icon: 'success',
          duration: 1500
        })

      } catch (error) {
        // 隐藏加载动画
        wx.hideLoading()

        console.error('❌ 翻译失败:', error)
        this.setData({ translating: false })

        wx.showModal({
          title: '翻译失败',
          content: error.message || '翻译服务暂时不可用，请稍后重试',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    },

    /**
     * 复制翻译文本
     */
    copyTranslatedText() {
      if (!this.data.translatedText) {
        wx.showToast({
          title: '先翻译后再复制',
          icon: 'info'
        })
        return
      }

      wx.setClipboardData({
        data: this.data.translatedText,
        success: () => {
          // 触觉反馈 - 复制成功
          wx.vibrateShort({ type: 'light' })

          wx.showToast({
            title: '已复制粤语文本',
            icon: 'success',
            duration: 1500
          })
        },
        fail: () => {
          wx.showToast({
            title: '复制失败',
            icon: 'error'
          })
        }
      })
    },

    /**
     * 返回首页重新录音
     */
    backToHome() {
      wx.navigateBack({
        delta: 1
      })
    },

    /**
     * 处理语音类型选择
     */
    selectVoiceType(e) {
      this.setData({
        selectedVoiceType: parseInt(e.detail.value)
      })
      console.log(`🎙️ 已选择语音类型: ${e.detail.value === '0' ? '女性' : '男性'}`)
    },

    /**
     * 转换为语音并播放
     */
    async textToSpeechAndPlay() {
      if (!this.data.translatedText) {
        wx.showToast({
          title: '请先翻译文本',
          icon: 'none'
        })
        return
      }

      if (this.data.speaking) {
        // 正在播放，停止当前播放
        this.stopAudio()
        return
      }

      try {
        this.setData({ speaking: true })

        console.log(`🎙️ 开始转换语音 (${this.data.selectedVoiceType === 0 ? '女性' : '男性'})...`)

        // 调用 TTS 服务
        const audioPath = await request.textToSpeech(
          this.data.translatedText,
          this.data.selectedVoiceType
        )

        console.log(`✅ 语音转换成功，开始播放...`)

        // 触觉反馈 - TTS 转换成功
        wx.vibrateShort({ type: 'light' })

        // 保存音频路径
        this.setData({
          currentAudioPath: audioPath
        })

        // 使用 InnerAudioContext 播放音频（推荐方式）
        console.log(`🔊 准备播放音频: ${audioPath}`)

        this.audioContext.src = audioPath
        this.audioContext.volume = 1.0  // 设置音量为最大

        this.audioContext.onPlay(() => {
          console.log('✅ 音频开始播放')
        })

        this.audioContext.onEnded(() => {
          console.log('✅ 音频播放完成')
          this.setData({ speaking: false })
        })

        this.audioContext.onError((err) => {
          console.error('❌ 音频播放失败:', {
            errCode: err.errCode,
            errMsg: err.errMsg,
            filePath: audioPath
          })
          this.setData({ speaking: false })

          wx.showModal({
            title: '播放失败',
            content: `错误: ${err.errMsg}\n文件: ${audioPath}`,
            showCancel: false,
            confirmText: '知道了'
          })
        })

        // 调用 play() 方法（不返回 Promise）
        try {
          this.audioContext.play()
          console.log('✅ 音频播放命令已发送')
        } catch (err) {
          console.error('❌ 播放命令失败:', err)
          this.setData({ speaking: false })
        }

      } catch (error) {
        console.error('❌ TTS 转换失败:', error)
        this.setData({ speaking: false })

        wx.showModal({
          title: 'TTS 失败',
          content: error.message || 'TTS 服务暂时不可用，请稍后重试',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    },

    /**
     * 停止音频播放
     */
    stopAudio() {
      if (this.audioContext) {
        this.audioContext.stop()
        this.setData({ speaking: false })
        console.log('⏹️ 已停止播放')
      }
    },

    /**
     * 翻译并朗读（一步完成）
     */
    async translateAndSpeak() {
      if (this.data.speaking) {
        this.stopAudio()
        return
      }

      try {
        this.setData({ speaking: true })

        // 显示加载动画
        wx.showLoading({
          title: '翻译并朗读中...',
          mask: true
        })

        console.log(`🎙️ 开始翻译并朗读 (${this.data.selectedVoiceType === 0 ? '女性' : '男性'})...`)

        // 调用组合服务（翻译 + TTS）
        const audioPath = await request.translateAndSpeak(
          this.data.recognizedText,
          'yue',  // 粤语
          this.data.selectedVoiceType
        )

        // 隐藏加载动画
        wx.hideLoading()

        console.log(`✅ 翻译并朗读成功，开始播放...`)

        // 触觉反馈 - 翻译并朗读成功
        wx.vibrateShort({ type: 'light' })

        // 保存音频路径
        this.setData({
          currentAudioPath: audioPath
        })

        // 使用 InnerAudioContext 播放音频（推荐方式）
        console.log(`🔊 准备播放音频: ${audioPath}`)

        this.audioContext.src = audioPath
        this.audioContext.volume = 1.0  // 设置音量为最大

        this.audioContext.onPlay(() => {
          console.log('✅ 音频开始播放')
        })

        this.audioContext.onEnded(() => {
          console.log('✅ 音频播放完成')
          this.setData({ speaking: false })
        })

        this.audioContext.onError((err) => {
          console.error('❌ 音频播放失败:', {
            errCode: err.errCode,
            errMsg: err.errMsg,
            filePath: audioPath
          })
          this.setData({ speaking: false })

          wx.showModal({
            title: '播放失败',
            content: `错误: ${err.errMsg}\n文件: ${audioPath}`,
            showCancel: false,
            confirmText: '知道了'
          })
        })

        // 调用 play() 方法（不返回 Promise）
        try {
          this.audioContext.play()
          console.log('✅ 音频播放命令已发送')
        } catch (err) {
          console.error('❌ 播放命令失败:', err)
          this.setData({ speaking: false })
        }

      } catch (error) {
        // 隐藏加载动画
        wx.hideLoading()

        console.error('❌ 翻译并朗读失败:', error)
        this.setData({ speaking: false })

        wx.showModal({
          title: '翻译并朗读失败',
          content: error.message || '服务暂时不可用，请稍后重试',
          showCancel: false,
          confirmText: '知道了'
        })
      }
    }
  })