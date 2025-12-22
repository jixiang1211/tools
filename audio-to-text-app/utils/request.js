/**
 * 网络请求工具函数
 * 用于上传音频文件到后端
 */

const app = getApp()

/**
 * 上传音频文件（带重试机制）
 * @param {string} audioPath - 音频文件临时路径
 * @param {number} retries - 重试次数，默认 2 次
 * @returns {Promise} 返回 TaskId
 */
function uploadAudio(audioPath, retries = 2) {
  return new Promise((resolve, reject) => {
    let attempts = 0

    const doUpload = () => {
      attempts++
      console.log(`[上传] 第 ${attempts} 次尝试...`)

      wx.showLoading({
        title: attempts > 1 ? `上传中...(重试${attempts - 1}次)` : '上传中...',
        mask: true
      })

      wx.uploadFile({
        url: `${app.globalData.apiBaseUrl}/api/audio-to-text`,
        filePath: audioPath,
        name: 'audio',
        method: 'POST',
        timeout: 300000,  // 上传超时时间：5分钟
        header: {
          'Authorization': 'Bearer your-token' // 如果服务器需要认证
        },
        success: (res) => {
          wx.hideLoading()
          console.log('[上传] 响应状态码:', res.statusCode)

          if (res.statusCode === 200) {
            try {
              // 解析响应数据
              const data = JSON.parse(res.data)

              if (data.code === 0) {
                // 成功 - 返回 TaskId
                console.log('[上传] 成功，TaskId:', data.data.taskId)
                resolve(data.data.taskId)
              } else {
                // 服务器返回错误
                reject(new Error(`上传失败: ${data.message || '未知错误'}`))
              }
            } catch (parseError) {
              reject(new Error(`响应数据格式错误: ${parseError.message}`))
            }
          } else if (res.statusCode === 413) {
            // 413 = Payload Too Large，文件太大
            reject(new Error('文件过大，请选择更小的音频'))
          } else {
            reject(new Error(`请求失败: HTTP ${res.statusCode}`))
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('[上传] 失败:', err)

          // 检查是否是连接错误
          if (err.errMsg.includes('ECONNRESET') || err.errMsg.includes('Connection')) {
            if (attempts < retries) {
              console.log(`[上传] 连接失败，${2000}ms 后重试...`)
              // 等待 2 秒后重试
              setTimeout(doUpload, 2000)
            } else {
              reject(new Error(`上传失败 ${attempts} 次后放弃: ${err.errMsg}`))
            }
          } else {
            reject(err)
          }
        }
      })
    }

    doUpload()
  })
}

/**
 * 检查任务状态
 * @param {string} taskId - 任务ID
 * @returns {Promise} 返回识别结果
 */
function checkTaskStatus(taskId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/audio-to-text/status/${taskId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data
          if (data.code === 0) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '查询失败'))
          }
        } else {
          reject(new Error(`查询失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 轮询检查任务结果
 * @param {string} taskId - 任务ID
 * @param {Function} onProgress - 进度回调
 * @returns {Promise} 返回最终识别结果
 */
function pollTaskResult(taskId, onProgress) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 5  // 最多轮询 5 次
    const interval = 1000 // 每 1 秒检查一次

    const pollFn = async () => {
      attempts++

      if (attempts > maxAttempts) {
        reject(new Error(`识别超时，请重试（轮询 ${attempts} 次后放弃）`))
        return
      }

      try {
        const taskData = await checkTaskStatus(taskId)

        if (onProgress) {
          onProgress({
            status: taskData.status,
            attempts: attempts
          })
        }

        if (taskData.status === 'completed') {
          resolve(taskData.result)
        } else if (taskData.status === 'failed') {
          reject(new Error(taskData.result || '识别失败'))
        } else if (taskData.status === 'timeout') {
          reject(new Error(taskData.result || '服务器查询超时'))
        } else {
          // 继续轮询
          setTimeout(pollFn, interval)
        }
      } catch (err) {
        // 查询出错，继续轮询
        console.warn('[轮询] 查询任务状态出错:', err.message)
        setTimeout(pollFn, interval)
      }
    }

    setTimeout(pollFn, interval)
  })
}

module.exports = {
  uploadAudio,
  checkTaskStatus,
  pollTaskResult
}
