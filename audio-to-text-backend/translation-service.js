/**
 * 翻译服务模块
 * 用于调用腾讯云翻译API
 */

const tencentcloud = require('tencentcloud-sdk-nodejs')
const TmtClient = tencentcloud.tmt.v20180321.Client

/**
 * 初始化腾讯云翻译客户端
 */
function initTencentTranslationClient() {
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY
    },
    region: process.env.TENCENT_REGION || 'ap-beijing',
    profile: {
      httpProfile: {
        endpoint: 'tmt.tencentcloudapi.com'
      }
    }
  }
  return new TmtClient(clientConfig)
}

/**
 * 翻译文本
 * @param {string} text - 要翻译的文本
 * @param {string} sourceLang - 源语言代码（默认：'zh'）
 * @param {string} targetLang - 目标语言代码（默认：'zh-HK'）
 * @returns {Promise<string>} 返回翻译后的文本
 */
async function translateText(text, sourceLang = 'zh', targetLang = 'zh-HK') {
  try {
    const client = initTencentTranslationClient()

    const params = {
      SourceText: text,
      Source: sourceLang,
      Target: targetLang,
      ProjectId: 0
    }

    console.log('🌐 正在调用腾讯云翻译API...')
    console.log(`   源语言: ${sourceLang}, 目标语言: ${targetLang}`)

    const response = await client.TextTranslate(params)

    console.log('✅ 翻译成功')

    return response.TargetText

  } catch (error) {
    console.error('❌ 翻译失败:', error.message)
    throw error
  }
}

module.exports = {
  translateText
}
