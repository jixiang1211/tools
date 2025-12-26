/**
 * 翻译和语音服务模块
 * 用于调用 DeepSeek API 进行翻译
 * 用于调用腾讯云 TTS API 进行文本转语音
 */

const https = require('https')
const crypto = require('crypto')

/**
 * 调用 DeepSeek API 翻译文本
 * @param {string} text - 要翻译的文本
 * @param {string} sourceLang - 源语言代码（默认：'zh'，中文）
 * @param {string} targetLang - 目标语言代码（默认：'yue'，粤语）
 * @returns {Promise<string>} 返回翻译后的文本
 */
async function translateText(text, sourceLang = 'zh', targetLang = 'yue') {
  return new Promise((resolve, reject) => {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY
      const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions'
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

      if (!apiKey) {
        throw new Error('DeepSeek API 密钥未配置，请在 .env 文件中设置 DEEPSEEK_API_KEY')
      }

      // 构建翻译提示词
      let targetLangName = targetLang === 'yue' ? '粤语' : targetLang
      const prompt = `你是一位资深翻译专家。请将以下${sourceLang === 'zh' ? '普通话' : '文本'}翻译成${targetLangName}，使用香港地区的日常用语和表达习惯。翻译时保持原意，不要添加其他内容。只返回翻译结果，不要包含任何解释。

原文：${text}

翻译结果：`

      console.log(`🌐 正在调用 DeepSeek API 翻译...`)
      console.log(`   源语言: ${sourceLang}, 目标语言: ${targetLang}`)

      const requestBody = JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,  // 降低温度以获得更一致的翻译
        max_tokens: 2000
      })

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }

      const req = https.request(apiUrl, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              console.error(`❌ DeepSeek API 返回错误状态码: ${res.statusCode}`)
              console.error(`   响应内容: ${data}`)

              const errorData = JSON.parse(data)
              const errorMessage = errorData.error?.message || '未知错误'
              throw new Error(`DeepSeek API 错误 (${res.statusCode}): ${errorMessage}`)
            }

            const response = JSON.parse(data)
            const translatedText = response.choices[0].message.content.trim()

            console.log('✅ 翻译成功')
            console.log(`   结果长度: ${translatedText.length} 字符`)

            resolve(translatedText)
          } catch (error) {
            console.error('❌ 解析 DeepSeek 响应失败:', error.message)
            reject(error)
          }
        })
      })

      req.on('error', (error) => {
        console.error('❌ DeepSeek API 请求失败:', error.message)
        reject(new Error(`DeepSeek API 请求失败: ${error.message}`))
      })

      req.write(requestBody)
      req.end()

    } catch (error) {
      console.error('❌ 翻译服务错误:', error.message)
      reject(error)
    }
  })
}

/**
 * 调用腾讯云 TTS API
 * @param {string} text - 要转换的文本
 * @param {number} voiceType - 语音类型（0=女性，1=男性）
 * @param {number} primaryLanguage - 主语言类型（1=中文，2=英文，默认1）
 * @returns {Promise<Buffer>} 返回音频 Buffer
 *
 * 注意：腾讯云 TTS 不支持粤语（voiceLanguage=3）作为语言参数。
 * 粤语音色需要通过 VoiceType 来选择。
 * 具体的粤语音色 ID 请参考腾讯云音色列表。
 */
async function textToSpeech(text, voiceType = 0, primaryLanguage = 1) {
  return new Promise((resolve, reject) => {
    try {
      const secretId = process.env.TENCENT_SECRET_ID
      const secretKey = process.env.TENCENT_SECRET_KEY

      if (!secretId || !secretKey) {
        throw new Error('腾讯云凭证未配置')
      }

      // 构建请求
      const host = 'tts.tencentcloudapi.com'
      const action = 'TextToVoice'
      const version = '2019-08-23'
      const region = process.env.TENCENT_REGION || 'ap-beijing'
      const service = 'tts'
      const algorithm = 'TC3-HMAC-SHA256'
      const timestamp = Math.floor(Date.now() / 1000)
      const date = new Date(timestamp * 1000).toISOString().split('T')[0]

      // 请求参数
      const payload = JSON.stringify({
        Text: text,
        SessionId: `tts_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ModelType: 1,                    // 通用模型
        SampleRate: 16000,               // 16kHz
        Codec: 'wav',                    // WAV 格式
        VoiceType: voiceType,            // 音色 ID（具体值需查询腾讯云文档）
        PrimaryLanguage: primaryLanguage // 主语言（1=中文，2=英文）
      })

      // 签名 (TC3 算法)
      const canonicalRequest = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${crypto.createHash('sha256').update(payload).digest('hex')}`

      const credentialScope = `${date}/${service}/tc3_request`
      const hashedRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
      const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedRequest}`

      const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest()
      const secretService = crypto.createHmac('sha256', secretDate).update(service).digest()
      const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest()
      const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex')

      const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`

      console.log(`🔊 正在调用腾讯云 TTS API...`)
      console.log(`   语音类型: ${voiceType === 0 ? '女性' : '男性'}, 文本长度: ${text.length} 字符`)

      const options = {
        hostname: host,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': host,
          'X-TC-Action': action,
          'X-TC-Version': version,
          'X-TC-Timestamp': timestamp,
          'Authorization': authorization
        }
      }

      const req = https.request(options, (res) => {
        let data = Buffer.alloc(0)

        res.on('data', (chunk) => {
          data = Buffer.concat([data, chunk])
        })

        res.on('end', () => {
          try {
            const response = JSON.parse(data.toString())

            if (response.Response?.Error) {
              throw new Error(`腾讯云 TTS 错误: ${response.Response.Error.Message}`)
            }

            if (response.Response?.Audio) {
              const audioBuffer = Buffer.from(response.Response.Audio, 'base64')
              console.log('✅ TTS 成功')
              console.log(`   音频大小: ${audioBuffer.length} 字节`)
              resolve(audioBuffer)
            } else {
              throw new Error('腾讯云 TTS 返回的音频数据为空')
            }
          } catch (error) {
            console.error('❌ 解析 TTS 响应失败:', error.message)
            reject(error)
          }
        })
      })

      req.on('error', (error) => {
        console.error('❌ TTS 请求失败:', error.message)
        reject(new Error(`腾讯云 TTS 请求失败: ${error.message}`))
      })

      req.write(payload)
      req.end()

    } catch (error) {
      console.error('❌ TTS 服务错误:', error.message)
      reject(error)
    }
  })
}

module.exports = {
  translateText,
  textToSpeech
}
