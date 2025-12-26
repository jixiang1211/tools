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

    onLoad(options) {
      if (options.text) {
        const decodedText = decodeURIComponent(options.text)
        this.setData({
          recognizedText: decodedText
        })
      }
    },

    /**
     * 复制文字到剪贴板
     */
    copyText() {
      wx.setClipboardData({
        data: this.data.recognizedText,
        success: () => {
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

        console.log('🔄 开始翻译...')

        const translatedText = await request.translateText(
          this.data.recognizedText,
          'zh-HK'
        )

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

        console.log('🌐 开始翻译...')

        const translatedText = await request.translateText(
          this.data.recognizedText,
          'yue'  // 粤语
        )

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

        // 保存音频路径
        this.setData({
          currentAudioPath: audioPath
        })

        // 播放音频
        wx.playVoice({
          filePath: audioPath,
          success: () => {
            console.log('✅ 音频播放成功')
            this.setData({ speaking: false })
          },
          fail: (err) => {
            console.error('❌ 音频播放失败:', err)
            this.setData({ speaking: false })

            wx.showToast({
              title: '播放失败',
              icon: 'error'
            })
          }
        })

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
      wx.stopVoice({
        success: () => {
          this.setData({ speaking: false })
          console.log('⏹️ 已停止播放')
        }
      })
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

        console.log(`🎙️ 开始翻译并朗读 (${this.data.selectedVoiceType === 0 ? '女性' : '男性'})...`)

        // 调用组合服务（翻译 + TTS）
        const audioPath = await request.translateAndSpeak(
          this.data.recognizedText,
          'yue',  // 粤语
          this.data.selectedVoiceType
        )

        console.log(`✅ 翻译并朗读成功，开始播放...`)

        // 保存音频路径
        this.setData({
          currentAudioPath: audioPath
        })

        // 播放音频
        wx.playVoice({
          filePath: audioPath,
          success: () => {
            console.log('✅ 音频播放成功')
            this.setData({ speaking: false })
          },
          fail: (err) => {
            console.error('❌ 音频播放失败:', err)
            this.setData({ speaking: false })

            wx.showToast({
              title: '播放失败',
              icon: 'error'
            })
          }
        })

      } catch (error) {
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