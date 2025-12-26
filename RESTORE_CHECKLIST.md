# 下次恢复工作检查清单

**创建日期**: 2025-12-26
**状态**: 工作已保存，准备好继续

---

## ✅ 已完成的任务

- [x] 诊断出问题的根本原因
- [x] 发现腾讯云 TTS API 不支持粤语作为语言参数
- [x] 修正所有代码使用正确的 API 参数名
- [x] 重启后端服务器验证修改
- [x] 确认 API 调用成功（HTTP 200）
- [x] 创建详细的文档记录进度

## 🔴 当前阻塞点

**需要确认**: 粤语对应的腾讯云 TTS VoiceType ID 值

这是解决问题的最后一步！

---

## 📋 恢复工作步骤

### 步骤 1：查看快速参考
打开并阅读：`QUICK_REFERENCE.md`
这会快速让你理解当前的进度

### 步骤 2：启动后端服务器
```bash
cd D:/projects/tools-1/audio-to-text-backend
PORT=9002 node server-v2.js
```

### 步骤 3：确认粤语音色 ID
使用以下三种方法中的一种：

**方法 A - 查询文档（最快）**
- 访问: https://cloud.tencent.com/document/product/1073/92668
- 查找粤语音色的 VoiceType ID
- 记录下来（例如：ID = 5）

**方法 B - 运行测试脚本**
```bash
bash D:/projects/tools-1/test-voicetype-cantonese.sh
```
然后播放 `/tmp/test-voice-*.wav` 文件找出粤语

**方法 C - 腾讯云控制台**
登录腾讯云 → TTS 服务 → 测试页面
逐一测试不同的音色找出粤语

### 步骤 4：更新代码
编辑文件：`audio-to-text-backend/api-routes.js`

找到约第 264 行的 `/api/translate-and-speak` 端点：
```javascript
// 当前代码（错误）
const primaryLanguage = 1

// 改为（示例，假设粤语 ID 是 5）
const cantonese_voicetype = 5  // 替换为实际的粤语 VoiceType ID
const selectedVoiceType = language === 'yue' ? cantonese_voicetype : voiceType
```

完整的修改应该是：
```javascript
// Step 2: 将翻译结果转换为语音
console.log('🔄 Step 2: 文本转语音...')

// 根据目标语言选择合适的音色
const cantonese_voicetype = 5  // ← 替换为实际的粤语 VoiceType ID
const selectedVoiceType = language === 'yue' ? cantonese_voicetype : voiceType
const primaryLanguage = 1

const audioBuffer = await translationService.textToSpeech(
  translatedText,
  selectedVoiceType,  // 使用选定的音色（粤语或默认）
  primaryLanguage
)
console.log('✅ TTS 完成，音频大小:', audioBuffer.length, '字节')
```

### 步骤 5：重启后端验证
```bash
# 终止现有进程
# 重新启动
cd D:/projects/tools-1/audio-to-text-backend
PORT=9002 node server-v2.js
```

### 步骤 6：测试
```bash
# 测试翻译并朗读端点
curl -X POST http://127.0.0.1:9002/api/translate-and-speak \
  -H "Content-Type: application/json" \
  -d '{"text": "今天天气很好", "language": "yue", "voiceType": 0}' \
  -o /tmp/test-output.wav

# 播放 /tmp/test-output.wav 验证是否是粤语
```

### 步骤 7：更新文档
- 更新 TODO.md 标记粤语音色 ID
- 记录确认的 VoiceType ID 值
- 标记任务完成

---

## 📂 关键文件位置

| 文件 | 用途 |
|-----|-----|
| `QUICK_REFERENCE.md` | 快速查看当前进度 |
| `SESSION_SUMMARY_20251226.md` | 详细的会话总结 |
| `audio-to-text-backend/translation-service.js` | TTS 服务实现 |
| `audio-to-text-backend/api-routes.js` | API 端点定义 |
| `audio-to-text-app/utils/request.js` | 前端网络请求 |
| `TODO.md` | 项目整体进度 |

---

## 🔍 验证检查列表

恢复工作后，检查以下项目：

- [ ] 后端服务器启动成功
- [ ] 能通过 `curl` 调用 `/api/translate-and-speak` 端点
- [ ] 获得 HTTP 200 响应
- [ ] 生成了 WAV 音频文件
- [ ] 音频文件大小合理（通常 30KB-100KB）
- [ ] 播放音频确认是粤语（不是中文）

---

## 📞 常见问题

### Q: 后端服务器如何启动？
```bash
cd D:/projects/tools-1/audio-to-text-backend
PORT=9002 node server-v2.js
```

### Q: 如何测试 API？
```bash
curl -X POST http://127.0.0.1:9002/api/translate-and-speak \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "language": "yue", "voiceType": 0}'
```

### Q: 粤语 VoiceType ID 在哪里找？
- 选项 1: 腾讯云文档 https://cloud.tencent.com/document/product/1073/92668
- 选项 2: 运行测试脚本 `bash test-voicetype-cantonese.sh`

### Q: 如何知道是否是粤语？
播放生成的 WAV 文件，听声音。粤语有独特的语调和发音。

### Q: 怎么修改 VoiceType ID？
在 `api-routes.js` 第 264 行附近，修改：
```javascript
const cantonese_voicetype = X  // 替换 X 为粤语的 VoiceType ID
```

---

## ✨ 完成后的步骤

一旦粤语语音正常工作，记录以下信息：

- [ ] 确认的粤语女性音色 VoiceType ID
- [ ] 确认的粤语男性音色 VoiceType ID（如果需要）
- [ ] 测试验证日期和结果
- [ ] 更新项目文档和配置

---

## 🎯 最终目标

✅ 用户录音并进行以下操作：
1. 上传音频 → 识别为中文
2. 翻译为粤语
3. **播放粤语语音**（不是中文）✅

---

**状态**: 工作已保存，随时可以继续
**预计完成时间**: 30 分钟（一旦确认粤语音色 ID）
**下次开始**: 第 3 步 - 确认粤语音色 ID

