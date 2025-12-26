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
      translating: false            // 是否正在翻译
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
     * 返回首页重新录音
     */
    backToHome() {
      wx.navigateBack({
        delta: 1
      })
    }
  })