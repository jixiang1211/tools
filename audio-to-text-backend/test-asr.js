/**
 * 腾讯云 ASR SDK 参数测试脚本
 * 用来验证 CreateRecTask 的正确参数
 */

require('dotenv').config()
const tencentcloud = require('tencentcloud-sdk-nodejs')
const AsrClient = tencentcloud.asr.v20190614.Client

async function testTencentCloudASR() {
  console.log('========================================')
  console.log('🧪 腾讯云 ASR SDK 参数测试')
  console.log('========================================')

  // 检查环境变量
  console.log('\n1️⃣ 检查环境变量...')
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY
  const region = process.env.TENCENT_REGION || 'ap-beijing'

  if (!secretId || !secretKey) {
    console.error('❌ 错误：未找到腾讯云密钥')
    console.error('   请确保 .env 文件中配置了：')
    console.error('   TENCENT_SECRET_ID=xxx')
    console.error('   TENCENT_SECRET_KEY=xxx')
    process.exit(1)
  }

  console.log('✅ 密钥已配置')
  console.log(`   SecretId: ${secretId.substring(0, 10)}...`)
  console.log(`   Region: ${region}`)

  // 初始化客户端
  console.log('\n2️⃣ 初始化腾讯云客户端...')
  const clientConfig = {
    credential: {
      secretId: secretId,
      secretKey: secretKey
    },
    region: region,
    profile: {
      httpProfile: {
        endpoint: 'asr.tencentcloudapi.com'
      }
    }
  }

  const client = new AsrClient(clientConfig)
  console.log('✅ 客户端初始化成功')

  // 准备测试音频数据（空音频）
  console.log('\n3️⃣ 准备测试参数...')
  const testAudioBase64 = 'UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='

  const params = {
    EngineModelType: '16k_zh',      // 16K 中文通用模型
    ChannelNum: 1,                  // 单声道
    ResTextFormat: 0,               // 返回识别文本
    SourceType: 1,                  // 本地文件上传
    Data: testAudioBase64,          // Base64 编码的音频
    DataLen: Buffer.from(testAudioBase64, 'base64').length  // 数据长度
  }

  console.log('✅ 参数已准备：')
  console.log(JSON.stringify(params, null, 2))

  // 测试 API 调用
  console.log('\n4️⃣ 调用 CreateRecTask API...')
  try {
    const response = await client.CreateRecTask(params)
    console.log('✅ API 调用成功！')
    console.log('\n📊 响应结果：')
    console.log(JSON.stringify(response, null, 2))

    // 检查响应中是否有 TaskId
    if (response.Data?.TaskId) {
      console.log('\n✅ 创建任务成功！')
      console.log(`   TaskId: ${response.Data.TaskId}`)
      console.log('\n🎉 腾讯云 ASR 集成正常！')
    } else {
      console.log('\n⚠️ 警告：TaskId 为空')
      console.log('   响应内容:', response.Data)
    }

  } catch (error) {
    console.error('\n❌ API 调用失败：')
    console.error(`   错误代码: ${error.code}`)
    console.error(`   错误信息: ${error.message}`)
    console.error('\n📋 详细错误：')
    console.error(JSON.stringify(error, null, 2))

    // 分析错误类型
    console.log('\n🔍 错误分析：')
    if (error.message.includes('UnknownParameter')) {
      console.log('   问题：存在无法识别的参数')
      console.log('   建议：检查参数名是否正确')
    } else if (error.message.includes('AuthFailure')) {
      console.log('   问题：认证失败（密钥错误）')
      console.log('   建议：检查 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY')
    } else if (error.message.includes('InvalidParameterValue')) {
      console.log('   问题：参数值无效')
      console.log('   建议：检查参数值是否符合要求')
    } else if (error.message.includes('PermissionDenied')) {
      console.log('   问题：权限不足')
      console.log('   建议：检查密钥是否有 ASR 服务权限')
    } else if (error.code === 'MissingParameter') {
      console.log('   问题：缺少必需参数')
      console.log('   建议：检查是否少了某些必需的参数')
    }

    process.exit(1)
  }
}

// 运行测试
testTencentCloudASR().catch(err => {
  console.error('测试脚本异常:', err)
  process.exit(1)
})
