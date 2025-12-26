/**
 * API 路由定义
 * 翻译端点
 */

const express = require('express')
const router = express.Router()
const translationService = require('./translation-service')

/**
 * 翻译端点
 * POST /api/translate
 *
 * 请求体：
 * {
 *   "text": "你好世界",
 *   "sourceLang": "zh",      // 可选，默认 'zh'
 *   "targetLang": "zh-HK"   // 可选，默认 'zh-HK'
 * }
 *
 * 响应：
 * {
 *   "code": 0,
 *   "message": "success",
 *   "data": {
 *     "translatedText": "你好世界",
 *     "sourceLang": "zh",
 *     "targetLang": "zh-HK"
 *   }
 * }
 */
router.post('/api/translate', async (req, res) => {
  try {
    // 验证输入
    const { text, sourceLang = 'zh', targetLang = 'zh-HK' } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        code: 1,
        message: '请提供需要翻译的文本'
      })
    }

    if (text.length > 2000) {
      return res.status(400).json({
        code: 1,
        message: '文本长度超过限制（最多2000字符）'
      })
    }

    console.log('📥 翻译请求:', {
      textLength: text.length,
      sourceLang,
      targetLang
    })

    // 调用翻译服务
    const translatedText = await translationService.translateText(
      text,
      sourceLang,
      targetLang
    )

    // 返回结果
    res.json({
      code: 0,
      message: 'success',
      data: {
        translatedText,
        sourceLang,
        targetLang
      }
    })

  } catch (error) {
    console.error('❌ 翻译失败:', error)

    // 检查API特定错误
    if (error.message.includes('UnsupportedLanguage')) {
      return res.status(400).json({
        code: 1,
        message: '不支持的语言代码',
        details: '目标语言可能不支持。尝试使用 zh-TW（繁体中文）代替。',
        error: error.message
      })
    }

    if (error.message.includes('SecretId') || error.message.includes('credentials')) {
      return res.status(500).json({
        code: 1,
        message: '服务器配置错误：腾讯云API密钥未配置',
        details: '请在 .env 文件中配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY'
      })
    }

    // 通用错误
    res.status(500).json({
      code: 1,
      message: '翻译失败',
      error: error.message
    })
  }
})

module.exports = router
