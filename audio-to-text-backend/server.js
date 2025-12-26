/**
 * 音频转文字服务器
 * 功能：
 * 1. 接收小程序上传的音频文件
 * 2. 转码为 WAV 格式
 * 3. 调用腾讯云语音识别API
 * 4. 返回识别结果给小程序
 */

const express = require('express')
const multer = require('multer')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegStatic = require('ffmpeg-static')
require('dotenv').config()

// 配置 ffmpeg 路径
ffmpeg.setFfmpegPath(ffmpegStatic)

// 腾讯云SDK导入
const tencentcloud = require('tencentcloud-sdk-nodejs')
const AsrClient = tencentcloud.asr.v20190614.Client

// 创建 Express 应用
const app = express()
const PORT = process.env.PORT || 3000

// 配置中间件
app.use(cors())
app.use(express.json())

// 设置服务器级别的超时时间为 10 分钟
app.use((req, res, next) => {
  req.setTimeout(600000)  // 10 分钟 = 600000 毫秒
  res.setTimeout(600000)
  next()
})

// 配置 multer（用于处理文件上传）
// 使用磁盘存储而不是内存存储，这样可以处理更大的文件
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)  // 保存到 uploads 目录
    },
    filename: (req, file, cb) => {
      const uniqueName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`
      cb(null, uniqueName)
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024  // 最大文件大小：50MB（之前是5MB，容易拒绝）
  },
  fileFilter: (req, file, cb) => {
    // 只接受音频文件（包括小程序的 audio/x-aac 格式）
    const allowedMimes = ['audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/x-aac', 'application/octet-stream']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`))
    }
  }
})

// 创建上传目录（用于保存临时文件）
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * 初始化腾讯云 ASR 客户端
 */
function initTencentClient() {
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY
    },
    region: process.env.TENCENT_REGION || 'ap-beijing',
    profile: {
      httpProfile: {
        endpoint: 'asr.tencentcloudapi.com'
      }
    }
  }

  return new AsrClient(clientConfig)
}

/**
 * 将音频文件转码为 WAV 格式
 * @param {Buffer} inputBuffer - 输入音频文件（M4A 或其他格式）
 * @param {string} inputFormat - 输入格式（m4a, mp3 等）
 * @returns {Promise<Buffer>} 返回 WAV 格式的音频 Buffer
 */
function convertToWav(inputBuffer, inputFormat = 'm4a') {
  return new Promise((resolve, reject) => {
    // 创建临时文件路径
    const tempInputPath = path.join(uploadDir, `input_${Date.now()}.${inputFormat}`)
    const tempOutputPath = path.join(uploadDir, `output_${Date.now()}.wav`)

    try {
      // 将 Buffer 写入临时输入文件
      fs.writeFileSync(tempInputPath, inputBuffer)

      // 使用 ffmpeg 进行转码
      ffmpeg(tempInputPath)
        .toFormat('wav')
        .audioCodec('pcm_s16le')  // PCM 16-bit 小端序
        .audioFrequency(16000)     // 16kHz 采样率
        .audioChannels(1)          // 单声道
        .on('end', () => {
          try {
            // 读取转码后的 WAV 文件
            const wavBuffer = fs.readFileSync(tempOutputPath)

            // 清理临时文件
            fs.unlinkSync(tempInputPath)
            fs.unlinkSync(tempOutputPath)

            console.log('✅ 音频转码成功，输出大小:', wavBuffer.length, '字节')
            resolve(wavBuffer)
          } catch (error) {
            reject(new Error(`读取转码文件失败: ${error.message}`))
          }
        })
        .on('error', (err) => {
          // 清理临时文件
          try {
            fs.unlinkSync(tempInputPath)
          } catch (e) {}

          reject(new Error(`转码失败: ${err.message}`))
        })
        .save(tempOutputPath)

    } catch (error) {
      reject(new Error(`转码初始化失败: ${error.message}`))
    }
  })
}

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// 在内存中存储任务状态（生产环境应使用数据库）
const taskStore = new Map()

/**
 * 语音识别端点（真实识别）
 * POST /api/audio-to-text
 * 返回 TaskId，前端轮询查询结果
 */
app.post('/api/audio-to-text', upload.single('audio'), async (req, res) => {
  // 设置这个请求的超时时间为 5 分钟（300 秒）
  req.setTimeout(300000)

  try {
    // ========== 第1步：验证文件上传 ==========
    if (!req.file) {
      return res.status(400).json({
        code: 1,
        message: '请上传音频文件'
      })
    }

    const audioFilePath = req.file.path  // 磁盘文件路径
    console.log('📥 收到音频文件，大小：', req.file.size, '字节')
    console.log('📂 文件路径：', audioFilePath)

    // ========== 第2步：转码音频为 WAV ==========
    console.log('🔄 正在转码音频格式...')

    let wavBuffer
    try {
      // 从磁盘文件读取并转码（不再使用内存 buffer）
      wavBuffer = await new Promise((resolve, reject) => {
        const tempOutputPath = path.join(uploadDir, `output_${Date.now()}.wav`)

        ffmpeg(audioFilePath)
          .toFormat('wav')
          .audioCodec('pcm_s16le')
          .audioFrequency(16000)
          .audioChannels(1)
          .on('end', () => {
            try {
              const buffer = fs.readFileSync(tempOutputPath)
              // 清理临时文件
              fs.unlinkSync(audioFilePath)
              fs.unlinkSync(tempOutputPath)
              resolve(buffer)
            } catch (err) {
              reject(err)
            }
          })
          .on('error', (err) => {
            try {
              fs.unlinkSync(audioFilePath)
            } catch (e) {}
            reject(err)
          })
          .save(tempOutputPath)
      })
    } catch (convertError) {
      console.error('❌ 转码失败:', convertError.message)
      return res.status(400).json({
        code: 1,
        message: '音频转码失败',
        error: convertError.message
      })
    }

    // ========== 第3步：转换为 Base64 ==========
    const audioBase64 = wavBuffer.toString('base64')
    console.log('✅ 音频已转码为 WAV，Base64 长度:', audioBase64.length)

    // ========== 第4步：调用腾讯云语音识别API ==========
    const client = initTencentClient()

    const params = {
      EngineModelType: '16k_zh',      // 16K中文通用模型
      ChannelNum: 1,                  // 声道数：1=单声道
      ResTextFormat: 0,               // 文本格式：0=识别文本
      SourceType: 1,                  // 1=本地文件上传
      Data: audioBase64,              // Base64编码的音频数据
      DataLen: wavBuffer.length       // 音频数据长度
    }

    console.log('🌐 正在调用腾讯云API创建识别任务...')

    // 创建异步识别任务
    const taskResponse = await client.CreateRecTask(params)
    console.log('✅ 创建任务成功，TaskId:', taskResponse.Data?.TaskId)

    if (!taskResponse.Data?.TaskId) {
      return res.status(500).json({
        code: 1,
        message: '创建识别任务失败',
        error: '腾讯云未返回 TaskId'
      })
    }

    const taskId = taskResponse.Data.TaskId

    // ========== 第5步：存储任务信息并立即返回 ==========
    // 在后台轮询查询结果
    const taskData = {
      taskId: taskId,
      status: 'processing',
      result: null,
      createdAt: Date.now(),
      attempts: 0
    }

    taskStore.set(taskId, taskData)

    // 在后台异步查询结果（不阻塞响应）
    pollTaskResult(taskId, client)

    // 立即返回 TaskId 给前端
    res.json({
      code: 0,
      message: 'success',
      data: {
        taskId: taskId,
        status: 'processing'
      }
    })

  } catch (error) {
    console.error('❌ 识别出错:', error)

    // 检查是否是配置错误
    if (error.message.includes('SecretId') || error.message.includes('credentials')) {
      return res.status(500).json({
        code: 1,
        message: '服务器配置错误：腾讯云API密钥未配置',
        details: '请在 .env 文件中配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY'
      })
    }

    res.status(500).json({
      code: 1,
      message: '语音识别失败',
      error: error.message
    })
  }
})

/**
 * 后台异步查询任务结果
 */
async function pollTaskResult(taskId, client) {
  let attempts = 0
  const maxAttempts = 30

  console.log(`⏳ 开始后台轮询任务 ${taskId}...`)

  while (attempts < maxAttempts) {
    attempts++

    // 第一次立即查询，之后每 2 秒查询一次（不要等太久）
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    try {
      const describeParams = {
        TaskId: taskId
      }

      const describeResponse = await client.DescribeTaskStatus(describeParams)

      // 调试：打印完整的响应
      console.log(`📊 第 ${attempts} 次查询任务 ${taskId}`)
      console.log('🔍 完整响应:', JSON.stringify(describeResponse, null, 2))

      // 关键修复：腾讯云返回的是 Status，不是 TaskStatus
      const status = describeResponse.Data?.Status

      console.log(`   状态值:`, status, `类型:`, typeof status)

      // 检查识别状态：2 = 成功
      if (status === 2) {
        // 状态 2 = 识别成功
        const result = describeResponse.Data?.Result

        console.log('✅ 任务识别成功，原始结果:', result)

        // 即使 result 为空，也要保存（不能用 if(result) 因为空字符串是 falsy）
        if (result !== undefined && result !== null) {
          // 腾讯云返回的结果格式是字符串，直接使用
          taskStore.set(taskId, {
            ...taskStore.get(taskId),
            status: 'completed',
            result: result || '（无识别结果，可能是静音或无声音）',
            attempts: attempts
          })
          console.log('✅ 任务结果已保存到 taskStore')
          return
        }
      } else if (status === 3 || status === 4) {
        // 状态 3 = 识别失败，4 = 任务超时
        console.log('❌ 任务识别失败，状态:', status)
        taskStore.set(taskId, {
          ...taskStore.get(taskId),
          status: 'failed',
          result: '识别失败，请重新录音',
          attempts: attempts
        })
        return
      } else {
        // 其他状态（1 = 等待中）继续查询
        console.log(`⏳ 任务仍在处理中，状态: ${status}，继续查询...`)
      }

    } catch (queryError) {
      console.error(`❌ 后台查询失败 (第 ${attempts} 次):`, queryError.message)
      if (attempts >= maxAttempts) {
        taskStore.set(taskId, {
          ...taskStore.get(taskId),
          status: 'timeout',
          result: '查询超时，请重试',
          attempts: attempts
        })
        return
      }
    }
  }
}

/**
 * 查询识别结果端点
 * GET /api/audio-to-text/status/:taskId
 */
app.get('/api/audio-to-text/status/:taskId', (req, res) => {
  // 关键修复：从 URL 参数获取的 taskId 是字符串，需要转换为数字
  // 因为后端存储时用的是数字，否则 Map.get() 会找不到
  const taskId = parseInt(req.params.taskId, 10)

  console.log(`🔍 查询任务状态，TaskId: ${taskId}，类型: ${typeof taskId}`)
  console.log(`📋 taskStore 中存储的所有 taskId:`, Array.from(taskStore.keys()))

  const taskData = taskStore.get(taskId)

  if (!taskData) {
    console.log(`❌ 任务不存在: ${taskId}`)
    return res.status(404).json({
      code: 1,
      message: '任务不存在'
    })
  }

  console.log(`✅ 找到任务，状态: ${taskData.status}`)
  res.json({
    code: 0,
    message: 'success',
    data: {
      taskId: taskId,
      status: taskData.status,
      result: taskData.result,
      attempts: taskData.attempts
    }
  })
})

/**
 * 模拟识别端点（用于测试，无需腾讯云密钥）
 * POST /api/audio-to-text-mock
 */
app.post('/api/audio-to-text-mock', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 1,
        message: '请上传音频文件'
      })
    }

    console.log('📥 收到音频文件（模拟模式），大小：', req.file.size, '字节')

    // 模拟识别结果（随机选择）
    const mockResults = [
      '这是一条识别的文字',
      '你好，这是音频转文字的测试',
      '微信小程序很有意思',
      '语音识别功能正在运行中',
      '成功转换了你的语音'
    ]

    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]

    res.json({
      code: 0,
      message: 'success',
      data: {
        text: randomResult,
        confidence: Math.random() * 0.4 + 0.6  // 模拟置信度 0.6-1.0
      }
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: '识别失败',
      error: error.message
    })
  }
})

/**
 * 文本转语音端点 - POST /api/text-to-speech
 * 支持男性和女性语音
 */
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const translationService = require('./translation-service')

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
      'Cache-Control': 'max-age=3600'
    })

    res.send(audioBuffer)

  } catch (error) {
    console.error('❌ TTS 失败:', error)

    if (error.message.includes('凭证未配置') || error.message.includes('TENCENT_')) {
      return res.status(500).json({
        code: 1,
        message: '服务器配置错误：腾讯云 API 密钥未配置',
        details: '请在 .env 文件中配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY'
      })
    }

    res.status(500).json({
      code: 1,
      message: 'TTS 转换失败',
      error: error.message
    })
  }
})

/**
 * 404 处理
 */
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的端点不存在',
    path: req.path
  })
})

/**
 * 错误处理中间件
 */
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
  })
})

/**
 * 启动服务器
 */
app.listen(PORT, () => {
  console.log('========================================')
  console.log(`🚀 音频转文字服务器已启动`)
  console.log(`📍 监听地址: http://localhost:${PORT}`)
  console.log(`🎤 音频编码: M4A → WAV (16kHz, 单声道)`)
  console.log(`🤖 识别引擎: 腾讯云 ASR`)
  console.log('========================================')
  console.log('')
  console.log('✅ 可用的API端点：')
  console.log(`   GET  http://localhost:${PORT}/health`)
  console.log(`   POST http://localhost:${PORT}/api/audio-to-text (真实识别)`)
  console.log(`   POST http://localhost:${PORT}/api/audio-to-text-mock (模拟识别)`)
  console.log('')
})
