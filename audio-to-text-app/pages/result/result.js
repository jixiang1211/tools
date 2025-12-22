/**
 * 结果页面 - 显示音频识别结果
 * 功能：
 * 1. 从首页接收识别的文字
 * 2. 显示识别结果
 * 3. 支持复制、分享等操作
 */

Page({
  data: {
    recognizedText: '',           // 识别的文字
    copied: false                 // 是否已复制（用于显示复制成功提示）
  },

  onLoad(options) {
    // 页面加载时，从上一个页面的参数获取识别文字
    // options 就是你传递的查询参数
    // 比如 ?text=你好 -> options.text = '你好'

    if (options.text) {
      // 需要解码，因为之前用了 encodeURIComponent
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
        // 复制成功的提示
        this.setData({ copied: true })

        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 1500
        })

        // 1.5秒后恢复"复制"按钮状态
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
   * 点击"更多"菜单中的"转发"时触发
   * 用于分享给微信好友
   */
  onShareAppMessage() {
    return {
      title: '语音转文字助手',
      path: '/pages/index/index',
      imageUrl: '/assets/icons/share.png'  // 分享时显示的图片
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
      delta: 1  // 返回上一个页面（首页）
    })
  }
})
