/**
 * API 路由定义
 * 翻译端点（使用 DeepSeek API）
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
 *   "sourceLang": "zh",      // 可选，默认 'zh'（中文）
 *   "targetLang": "yue"      // 可选，默认 'yue'（粤语）
 * }
 *
 * 响应：
 * {
 *   "code": 0,
 *   "message": "success",
 *   "data": {
 *     "translatedText": "你好世界",
 *     "sourceLang": "zh",
 *     "targetLang": "yue"
 *   }
 * }
 */
router.post('/api/translate', async (req, res) => {
  try {
    // 验证输入
    const { text, sourceLang = 'zh', targetLang = 'yue' } = req.body

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

    // 检查 API 特定错误
    if (error.message.includes('DEEPSEEK_API_KEY') || error.message.includes('未配置')) {
      return res.status(500).json({
        code: 1,
        message: '服务器配置错误：DeepSeek API 密钥未配置',
        details: '请在 .env 文件中配置 DEEPSEEK_API_KEY',
        error: error.message
      })
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return res.status(401).json({
        code: 1,
        message: 'DeepSeek API 密钥无效',
        details: '请检查 .env 文件中的 DEEPSEEK_API_KEY 是否正确',
        error: error.message
      })
    }

    if (error.message.includes('429') || error.message.includes('Rate limit')) {
      return res.status(429).json({
        code: 1,
        message: 'API 限流，请稍后重试',
        error: error.message
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

/**
 * 文本转语音端点
 * POST /api/text-to-speech
 *
 * 请求体：
 * {
 *   "text": "你好世界",
 *   "voiceType": 0          // 可选，默认 0（女性）。0=女性，1=男性
 * }
 *
 * 响应：
 * - 成功: 返回 WAV 格式音频文件（二进制）
 *   - Content-Type: audio/wav
 *   - Content-Length: [文件大小]
 * - 失败: 返回 JSON 错误响应
 *   {
 *     "code": 1,
 *     "message": "错误信息"
 *   }
 */
router.post('/api/text-to-speech', async (req, res) => {
  try {
    // 验证输入
    const { text, voiceType = 0 } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        code: 1,
        message: '请提供需要转换的文本'
      })
    }

    if (text.length > 2000) {
      return res.status(400).json({
        code: 1,
        message: '文本长度超过限制（最多2000字符）'
      })
    }

    // 验证语音类型
    if (typeof voiceType !== 'number' || (voiceType !== 0 && voiceType !== 1)) {
      return res.status(400).json({
        code: 1,
        message: '语音类型无效，请使用 0（女性）或 1（男性）'
      })
    }

    console.log('📥 TTS 请求:', {
      textLength: text.length,
      voiceType: voiceType === 0 ? '女性' : '男性'
    })

    // 调用 TTS 服务
    const audioBuffer = await translationService.textToSpeech(text, voiceType)

    // 返回音频文件
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'max-age=3600'  // 缓存 1 小时
    })

    res.send(audioBuffer)

  } catch (error) {
    console.error('❌ TTS 失败:', error)

    // 检查凭证错误
    if (error.message.includes('凭证未配置') || error.message.includes('TENCENT_')) {
      return res.status(500).json({
        code: 1,
        message: '服务器配置错误：腾讯云 API 密钥未配置',
        details: '请在 .env 文件中配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY'
      })
    }

    // 通用错误
    res.status(500).json({
      code: 1,
      message: 'TTS 转换失败',
      error: error.message
    })
  }
})

/**
 * 翻译并朗读端点
 * POST /api/translate-and-speak
 *
 * 请求体：
 * {
 *   "text": "你好世界",
 *   "language": "yue",           // 目标语言，可选，默认 'yue'（粤语）
 *   "voiceType": 0               // 语音类型，可选，默认 0（女性）
 * }
 *
 * 响应：
 * - 成功: 返回 WAV 格式音频文件（二进制）
 *   - Content-Type: audio/wav
 *   - Content-Length: [文件大小]
 * - 失败: 返回 JSON 错误响应
 */
router.post('/api/translate-and-speak', async (req, res) => {
  try {
    // 验证输入
    const { text, language = 'yue', voiceType = 0 } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        code: 1,
        message: '请提供需要处理的文本'
      })
    }

    if (text.length > 2000) {
      return res.status(400).json({
        code: 1,
        message: '文本长度超过限制（最多2000字符）'
      })
    }

    // 验证语音类型
    if (typeof voiceType !== 'number' || (voiceType !== 0 && voiceType !== 1)) {
      return res.status(400).json({
        code: 1,
        message: '语音类型无效，请使用 0（女性）或 1（男性）'
      })
    }

    console.log('📥 翻译并朗读请求:', {
      textLength: text.length,
      targetLanguage: language,
      voiceType: voiceType === 0 ? '女性' : '男性'
    })

    // Step 1: 翻译文本
    console.log('🔄 Step 1: 翻译文本...')
    const translatedText = await translationService.translateText(text, 'zh', language)
    console.log('✅ 翻译完成:', translatedText)

    // Step 2: 将翻译结果转换为语音
    console.log('🔄 Step 2: 文本转语音...')
    const audioBuffer = await translationService.textToSpeech(translatedText, voiceType)
    console.log('✅ TTS 完成，音频大小:', audioBuffer.length, '字节')

    // 返回音频文件
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'max-age=3600'
    })

    res.send(audioBuffer)

  } catch (error) {
    console.error('❌ 翻译并朗读失败:', error)

    // 检查凭证错误
    if (error.message.includes('凭证未配置') || error.message.includes('TENCENT_') || error.message.includes('DEEPSEEK_')) {
      return res.status(500).json({
        code: 1,
        message: '服务器配置错误',
        details: '请确保 .env 文件中已配置所有必需的 API 密钥',
        error: error.message
      })
    }

    // 通用错误
    res.status(500).json({
      code: 1,
      message: '翻译并朗读失败',
      error: error.message
    })
  }
})

module.exports = router
