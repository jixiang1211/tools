/**
 * 快速测试腾讯云翻译API
 * 用途：测试粤语(zh-HK)和繁体中文(zh-TW)支持
 */

require('dotenv').config()
const tencentcloud = require('tencentcloud-sdk-nodejs')
const TmtClient = tencentcloud.tmt.v20180321.Client

// 初始化翻译客户端
function initTranslationClient() {
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

// 测试翻译
async function testTranslation() {
  const client = initTranslationClient()
  const testText = '你好，我是语音转文字助手'

  console.log('\n========== 腾讯云翻译API测试 ==========')
  console.log(`测试文本：${testText}\n`)

  // 测试1: zh-HK (香港中文/粤语代理)
  console.log('📝 测试1: 翻译为 zh-HK (香港中文)')
  console.log('━'.repeat(50))
  try {
    const response = await client.TextTranslate({
      SourceText: testText,
      Source: 'zh',
      Target: 'zh-HK',
      ProjectId: 0
    })

    console.log('✅ 成功！')
    console.log(`📤 原文：${testText}`)
    console.log(`📥 译文：${response.TargetText}`)
    console.log(`语言代码：${response.Target}`)
  } catch (error) {
    console.log('❌ 失败！')
    console.log(`错误信息：${error.message}`)
    if (error.message.includes('UnsupportedLanguage')) {
      console.log('⚠️  zh-HK 不支持（可能原因：该语言不在支持列表中）')
    }
  }

  // 稍停顿
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 测试2: zh-TW (台湾繁体中文，备选方案)
  console.log('\n📝 测试2: 翻译为 zh-TW (台湾繁体中文)')
  console.log('━'.repeat(50))
  try {
    const response = await client.TextTranslate({
      SourceText: testText,
      Source: 'zh',
      Target: 'zh-TW',
      ProjectId: 0
    })

    console.log('✅ 成功！')
    console.log(`📤 原文：${testText}`)
    console.log(`📥 译文：${response.TargetText}`)
    console.log(`语言代码：${response.Target}`)
  } catch (error) {
    console.log('❌ 失败！')
    console.log(`错误信息：${error.message}`)
  }

  console.log('\n========== 测试完毕 ==========\n')
  console.log('📊 测试总结：')
  console.log('- 如果两个都成功：可以用 zh-HK 作为首选，zh-TW 作为备选')
  console.log('- 如果只有 zh-TW 成功：可以改用繁体中文翻译')
  console.log('- 如果都失败：建议改为多语言选择或只保留翻译不朗读')
}

// 运行测试
testTranslation().catch(err => {
  console.error('❌ 测试出错:', err)
  process.exit(1)
})
