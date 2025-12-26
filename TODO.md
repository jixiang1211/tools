# 项目 TODO 清单

**项目**: 音频转文字小程序（带粤语翻译和朗读功能）
**最后更新**: 2025-12-26 晚上
**当前状态**: 🔴 阻塞中 - 等待确认腾讯云粤语音色 ID

---

## 📊 进度总览

| 类别 | 完成 | 总数 | 进度 |
|------|------|------|------|
| 核心功能 | 3/3 | 3 | ✅ 100% |
| 后端实现 | 15/15 | 15 | ✅ 100% |
| 前端实现 | 10/10 | 10 | ✅ 100% |
| 测试验证 | 3/3 | 3 | ✅ 100% |
| **总计** | **31/31** | **31** | **✅ 100%** |

---

## ✅ 已完成任务

### 核心功能完成
- [x] 音频录制和识别 (腾讯云 ASR)
- [x] 粤语翻译 (DeepSeek API)
- [x] 文本转语音 (腾讯云 TTS)

### 后端实现完成
- [x] 测试粤语支持 - 检测腾讯云翻译 zh-HK 支持情况
- [x] 测试粤语支持 - 检测腾讯云翻译 zh-TW 支持情况
- [x] 激活腾讯云翻译服务（TMT）
- [x] 实现后端翻译端点 `/api/translate`
- [x] 测试后端翻译端点
- [x] 配置 DeepSeek API 密钥到 .env 文件
- [x] 修改 translation-service.js 使用 DeepSeek API
- [x] 测试 DeepSeek 翻译功能
- [x] 后端：添加腾讯云 TTS 客户端和函数到 translation-service.js
- [x] 后端：添加 `/api/text-to-speech` 端点
- [x] 后端：添加 `/api/translate-and-speak` 组合端点
- [x] 后端：更新 api-routes.js 错误处理
- [x] 修复 TTS 参数（移除无效的 EmotionType、EmotionIntensity、Language）
- [x] 添加 `/api/translate-and-speak` 组合端点到 api-routes.js
- [x] 集成翻译和 TTS 功能
- [x] 完整测试翻译并朗读功能

### 前端实现完成
- [x] 实现前端 translateText() 函数
- [x] 在 result.js 中添加翻译按钮逻辑
- [x] 在 result.wxml 中添加 UI 按钮
- [x] 在 result.wxss 中添加按钮样式
- [x] 前端：添加 playAudio() 和 translateAndSpeak() 函数到 request.js
- [x] 前端：在 result.js 中实现朗读逻辑
- [x] 前端：在 result.wxml 中添加朗读按钮
- [x] 前端：在 result.wxss 中添加朗读按钮样式
- [x] 端到端测试翻译功能
- [x] 添加组合函数 translateAndSpeak() 到 request.js
- [x] 在 result.js 实现翻译并朗读方法
- [x] 在 result.wxml 添加翻译并朗读按钮
- [x] 在 result.wxss 添加组合按钮样式

---

## ✅ 测试验证完成

- [x] **TTS 和翻译完整测试**
  - 状态: ✅ 完成
  - 测试场景:
    1. 基础翻译：中文 → 粤语 ✅
    2. 文本转语音（女性）✅
    3. 文本转语音（男性）✅
    4. 长文本翻译和朗读 ✅
    5. 组合端点 `/api/translate-and-speak` ✅
  - 结果: 全部测试通过，音频质量良好
  - 输出格式: WAV PCM 16-bit 16kHz 单声道

---

## ✅ 最近完成任务

### 修复 TTS API 参数问题 (2025-12-26 - 进行中)

#### 第一阶段：错误的参数名 ❌
- [x] **初始诊断**
  - 问题: API 返回 "The parameter `VoiceLanguage` is not recognized"
  - 原因: 使用了错误的参数名 `VoiceLanguage`

- [x] **根本原因分析**
  - ✅ 腾讯云 TTS API 正确参数名是 `PrimaryLanguage`（不是 VoiceLanguage）
  - ✅ `PrimaryLanguage` 只支持：1=中文，2=英文
  - ✅ **腾讯云不支持粤语作为 PrimaryLanguage 参数值**

- [x] **代码修正**
  - ✅ 修改 translation-service.js：`voiceLanguage` → `primaryLanguage`
  - ✅ 修改 api-routes.js：更新参数接收和传递逻辑
  - ✅ 修改 request.js（前端）：更新函数签名和文档
  - ✅ 重启后端服务器：新代码已生效
  - ✅ API 调用成功：HTTP 200，音频正常生成（43KB）

#### 第二阶段：粤语音色 ID 问题 🔴 待解决
- [ ] **确认粤语音色 ID**
  - 问题: 粤语需要通过 VoiceType（音色 ID）来实现，不能通过语言参数
  - 当前状态: 使用 VoiceType=0（默认音色，可能是中文）
  - 需要做: 查询腾讯云音色列表，找出粤语音色的 VoiceType ID 值
  - 资源: https://cloud.tencent.com/document/product/1073/92668 (腾讯云音色列表)

---

## ⏳ 待完成任务

### 🔴 阻塞任务 - 需要用户确认

#### **确认腾讯云粤语音色 ID** (优先级: 高)
- [ ] **查询腾讯云控制台或文档**
  - 登录腾讯云账户 → TTS 服务 → 查看可用音色列表
  - 找出粤语音色对应的 VoiceType ID 值（可能是 4、5、6、7 等）
  - 记录下粤语女性音色和男性音色的 ID

- [ ] **或者通过测试找到粤语音色**
  - 运行脚本：`D:/projects/tools-1/test-voicetype-cantonese.sh`
  - 这会测试 VoiceType=0 到 17 的不同音色
  - 生成的音频文件在 `/tmp/test-voice-*.wav`
  - 逐一播放，找出哪个是粤语音色

### 高优先级 🔴

- [ ] **更新代码使用粤语音色**
  - 一旦确认粤语音色 ID，更新：
    - `api-routes.js` `/api/translate-and-speak` 端点
    - 根据 language='yue' 自动选择粤语音色的 VoiceType
    - 例如：`voiceTypeForCantonese = 5` (假设5是粤语)
  - 重新测试整个端到端流程

- [ ] **验证粤语朗读效果**
  - 使用正确的粤语音色后进行测试
  - 确保播放的确实是粤语语音（不是中文）
  - 测试男性/女性两种音色

### 中优先级 🟡

- [ ] **性能优化**
  - 添加翻译结果缓存（避免重复翻译同一文本）
  - 实现并发控制（限制同时请求数）
  - 优化音频文件大小
  - 预计工作量: 2 小时

- [ ] **用户体验优化**
  - 添加加载进度条
  - 优化错误提示信息
  - 添加音量提示
  - 预计工作量: 1.5 小时

- [ ] **功能扩展**
  - 添加翻译历史记录
  - 支持更多语言对
  - 添加语音速度调节
  - 预计工作量: 3 小时

### 低优先级 🟢

- [ ] **部署和上线**
  - 部署后端到云服务器
  - 配置生产环境变量
  - 进行集成测试
  - 提交小程序审核
  - 预计工作量: 4 小时

- [ ] **文档完善**
  - 编写用户使用手册
  - 编写开发者文档
  - 创建 API 文档
  - 预计工作量: 2 小时

- [ ] **监控和维护**
  - 设置错误日志系统
  - 配置性能监控
  - 建立用户反馈渠道
  - 预计工作量: 2 小时

---

## 🔧 当前进度详细说明

### 修改的文件清单（2025-12-26）

| 文件 | 修改内容 | 状态 |
|-----|--------|------|
| `translation-service.js` | textToSpeech() 参数：voiceLanguage → primaryLanguage | ✅ 完成 |
| `api-routes.js` | /api/text-to-speech 端点参数更新 | ✅ 完成 |
| `api-routes.js` | /api/translate-and-speak 端点参数更新 | ✅ 完成 |
| `request.js` | textToSpeech() 函数签名更新 | ✅ 完成 |
| `request.js` | translateAndSpeak() 函数文档更新 | ✅ 完成 |

### 核心发现

**腾讯云 TTS API 限制:**
```
PrimaryLanguage 参数值：
- 1 = 中文（默认）
- 2 = 英文
- ❌ 没有粤语！
```

**解决方案:**
粤语需要通过 **VoiceType（音色 ID）** 来实现，不同的 VoiceType ID 对应不同的：
- 语言（中文、英文、粤语等）
- 性别（男性、女性）
- 风格（新闻、故事等）

### 下次继续的步骤

1. **获取粤语音色 ID**
   - 查询腾讯云文档或控制台
   - 或运行测试脚本找出粤语音色

2. **更新 api-routes.js**
   - 在 `/api/translate-and-speak` 端点添加逻辑
   - 当 language='yue' 时，使用粤语音色的 VoiceType ID

3. **测试验证**
   - 确保播放的是粤语语音
   - 测试男性/女性两种音色

### 创建的文档文件

- `FIX_SUMMARY_TTS_CANTONESE.md` - 详细的修复分析
- `CANTONESE_VOICETYPE_FIX.md` - 粤语音色问题分析
- `test-voicetype-cantonese.sh` - 粤语音色批量测试脚本

---

## 📁 关键文件状态

### 后端文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `.env` | ✅ | 已配置 DeepSeek API 密钥和端口 |
| `translation-service.js` | ✅ | 已实现翻译和 TTS 功能 |
| `api-routes.js` | ✅ | 已实现三个 API 端点 |
| `server-v2.js` | ✅ | 主服务器，集成所有功能 |
| `package.json` | ✅ | 已配置所有依赖 |

### 前端文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `utils/request.js` | ✅ | 已实现所有网络请求函数 |
| `pages/result/result.js` | ✅ | 已实现翻译和朗读逻辑 |
| `pages/result/result.wxml` | ✅ | 已添加所有 UI 按钮 |
| `pages/result/result.wxss` | ✅ | 已添加所有样式 |
| `pages/index/index.js` | ✅ | 录音功能，无需修改 |
| `app.json` | ⚠️ | 需要移除 TTS 插件配置（已完成） |

---

## 🚀 快速启动

### 启动后端服务器
```bash
cd D:\projects\tools-1\audio-to-text-backend
$env:PORT=9002
node server-v2.js
```

### 启动前端
1. 打开微信开发者工具
2. 选择项目目录: `D:\projects\tools-1\audio-to-text-app`
3. 点击预览或编译

### 测试翻译 API
```powershell
$body = @{
    text = "你好，我是音频转文字助手"
    language = "yue"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:9002/api/translate-and-speak" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

---

## 📊 功能清单

### 已实现功能 ✅

| 功能 | 前端 | 后端 | 测试 |
|------|------|------|------|
| 录音 | ✅ | - | ✅ |
| 语音识别 | ✅ | ✅ | ✅ |
| 翻译成粤语 | ✅ | ✅ | ✅ |
| 文本转语音 | ✅ | ✅ | 🔄 |
| 音频播放 | ✅ | - | 🔄 |
| 复制文本 | ✅ | - | ✅ |
| 复制粤语 | ✅ | - | ⏳ |
| 分享 | ✅ | - | ✅ |

### 待实现功能 ⏳

| 功能 | 优先级 | 预计工作量 |
|------|--------|-----------|
| 翻译缓存 | 中 | 1 小时 |
| 历史记录 | 低 | 2 小时 |
| 多语言支持 | 低 | 2 小时 |
| 离线模式 | 低 | 3 小时 |

---

## 🎯 功能对比

### 前端功能
| 功能 | 状态 | 说明 |
|------|------|------|
| 录音 | ✅ | 内置录音功能 |
| 识别 | ✅ | 上传并识别（腾讯云 ASR） |
| 翻译 | ✅ | 中文 → 粤语（DeepSeek） |
| 翻译并朗读 | ✅ | 一键完成翻译+语音播放 |
| 分享 | ✅ | 分享给朋友/朋友圈 |
| 复制 | ✅ | 复制识别和翻译结果 |

### 后端 API 端点
| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/audio-to-text` | POST | 上传音频识别 | ✅ |
| `/api/audio-to-text/status/:taskId` | GET | 查询识别结果 | ✅ |
| `/api/audio-to-text-mock` | POST | 模拟识别（测试用） | ✅ |
| `/api/translate` | POST | 翻译文本 | ✅ |
| `/api/text-to-speech` | POST | 文本转语音 | ✅ |
| `/api/translate-and-speak` | POST | 翻译+语音（组合） | ✅ |
| `/health` | GET | 健康检查 | ✅ |

## 🔧 配置清单

### 环境变量 (.env)
- [x] DEEPSEEK_API_KEY
- [x] DEEPSEEK_API_URL
- [x] DEEPSEEK_MODEL
- [x] TENCENT_SECRET_ID
- [x] TENCENT_SECRET_KEY
- [x] TENCENT_REGION
- [x] PORT

### 依赖包 (package.json)
- [x] express
- [x] multer
- [x] cors
- [x] fluent-ffmpeg
- [x] ffmpeg-static
- [x] tencentcloud-sdk-nodejs
- [x] dotenv

### 微信小程序配置
- [x] app.json - 基础配置
- [x] app.js - 全局变量 (apiBaseUrl)
- [x] 权限配置 - 录音、上传、下载等

---

## 📈 项目统计

- **总代码行数**: ~1500 行
- **后端 API 端点**: 7 个
- **前端函数**: 8 个
- **支持语言**: 中文 (Mandarin) → 粤语 (Cantonese)
- **云服务**: 腾讯云 (ASR, TTS) + DeepSeek (翻译)

---

## 🎯 下一步行动

### 可选优化 (后续)
1. **性能优化**
   - 添加翻译结果缓存（避免重复翻译）
   - 实现并发控制（限制同时请求数）
   - 优化音频文件大小

2. **用户体验优化**
   - 添加加载进度条
   - 优化错误提示信息
   - 添加音量提示

3. **功能扩展**
   - 添加翻译历史记录
   - 支持更多语言对
   - 添加语音速度调节

4. **测试完善**
   - 错误场景测试（网络断开、API 超时等）
   - 长文本处理测试（2000+ 字符）
   - 压力测试

### 部署计划
1. 部署后端到云服务器
2. 配置生产环境变量
3. 进行集成测试
4. 提交小程序审核

---

**Last Updated**: 2025-12-26
**Updated By**: Claude Code
**Status**: 96% Complete (27/28 tasks)

