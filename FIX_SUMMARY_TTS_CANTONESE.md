# TTS 粤语语音修复总结

**日期**: 2025-12-26
**问题**: TTS 生成的是中文语音，而不是粤语语音
**状态**: ✅ 已修复

---

## 问题分析

用户报告: "文本转语音的时候，产生的结果是中文语音，并不是粤语语音"

### 根本原因
腾讯云 TTS API 有多个语言参数:
- **VoiceLanguage**: 指定语音播放的语言（1=中文, 2=英文, 3=粤语）
- 原代码未传递此参数，导致 API 默认使用中文（1）

### 技术细节

**TTS API 参数说明**:
```javascript
{
  Text: "你好",
  VoiceType: 0,          // 语音类型（0=女性，1=男性）
  VoiceLanguage: 3,      // 语言代码（1=中文，2=英文，3=粤语）← 这个参数缺失！
  ModelType: 1,
  SampleRate: 16000,
  Codec: 'wav'
}
```

---

## 修复方案

### 1. 后端修改 (audio-to-text-backend)

#### 文件: `translation-service.js`

**修改前**:
```javascript
async function textToSpeech(text, voiceType = 0) {
  // ...
  const payload = JSON.stringify({
    Text: text,
    VoiceType: voiceType,
    // 缺少 VoiceLanguage！
  })
}
```

**修改后**:
```javascript
async function textToSpeech(text, voiceType = 0, voiceLanguage = 3) {
  // ...
  const payload = JSON.stringify({
    Text: text,
    VoiceType: voiceType,
    VoiceLanguage: voiceLanguage,  // ✅ 添加此参数，默认为 3（粤语）
  })
}
```

#### 文件: `api-routes.js`

**修改 `/api/text-to-speech` 端点**:
- 从请求体中提取 `voiceLanguage` 参数（默认值：3）
- 传递给 `translationService.textToSpeech(text, voiceType, voiceLanguage)`

```javascript
const { text, voiceType = 0, voiceLanguage = 3 } = req.body
const audioBuffer = await translationService.textToSpeech(text, voiceType, voiceLanguage)
```

**修改 `/api/translate-and-speak` 端点**:
- 根据翻译目标语言自动选择 voiceLanguage
- 粤语（'yue'）→ voiceLanguage = 3
- 其他语言 → voiceLanguage = 1

```javascript
const voiceLanguage = language === 'yue' ? 3 : 1
const audioBuffer = await translationService.textToSpeech(translatedText, voiceType, voiceLanguage)
```

### 2. 前端修改 (audio-to-text-app)

#### 文件: `utils/request.js`

**修改 `textToSpeech()` 函数**:
```javascript
function textToSpeech(text, voiceType = 0, voiceLanguage = 3) {
  wx.request({
    data: {
      text: text,
      voiceType: voiceType,
      voiceLanguage: voiceLanguage  // ✅ 显式传递语言参数
    }
  })
}
```

**修改 `translateAndSpeak()` 函数**:
```javascript
function translateAndSpeak(text, language = 'yue', voiceType = 0) {
  wx.request({
    data: {
      text: text,
      language: language,  // 后端会自动处理: 'yue' → voiceLanguage=3
      voiceType: voiceType
    }
  })
}
```

---

## 测试验证

### 测试场景 1: 直接调用 TTS 端点 (中文音频)
```bash
POST /api/text-to-speech
{
  "text": "你好，世界",
  "voiceType": 0,
  "voiceLanguage": 1  # 中文
}
```

**预期**: 生成中文语音的 WAV 文件

### 测试场景 2: 直接调用 TTS 端点 (粤语音频)
```bash
POST /api/text-to-speech
{
  "text": "你好，世界",
  "voiceType": 0,
  "voiceLanguage": 3  # 粤语
}
```

**预期**: 生成粤语语音的 WAV 文件

### 测试场景 3: 翻译并朗读端点 (粤语)
```bash
POST /api/translate-and-speak
{
  "text": "你好，世界",
  "language": "yue",  # 粤语
  "voiceType": 0
}
```

**预期流程**:
1. 翻译: 中文 → 粤语 (使用 DeepSeek)
2. TTS: 粤语 → 粤语语音 (voiceLanguage=3，自动计算)
3. 返回: 粤语语音的 WAV 文件

---

## 使用说明

### 后端 API 变化

**POST /api/text-to-speech**

新增参数:
- `voiceLanguage` (number, 可选): 语言代码
  - 1 = 中文 (简体/繁体混合)
  - 2 = 英文
  - 3 = 粤语 (默认)

示例:
```bash
curl -X POST http://127.0.0.1:9002/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好世界",
    "voiceType": 0,
    "voiceLanguage": 3
  }'
```

### 前端使用

**textToSpeech(text, voiceType, voiceLanguage)**

```javascript
// 默认粤语
await request.textToSpeech("你好", 0)

// 指定中文
await request.textToSpeech("你好", 0, 1)

// 指定英文
await request.textToSpeech("Hello", 0, 2)
```

**translateAndSpeak(text, language, voiceType)**

```javascript
// 默认翻译并朗读粤语
await request.translateAndSpeak("你好")

// 等价于以下过程：
// 1. 翻译: 中文 → 粤语
// 2. TTS: 粤语 → 粤语语音 (自动 voiceLanguage=3)
```

---

## 修改清单

| 文件 | 修改内容 | 行号 |
|-----|--------|------|
| `translation-service.js` | 添加 voiceLanguage 参数 | 114, 142 |
| `api-routes.js` | /api/text-to-speech: 接收并传递 voiceLanguage | 122, 138, 165, 169 |
| `api-routes.js` | /api/translate-and-speak: 自动选择 voiceLanguage | 257, 259, 260 |
| `request.js` | textToSpeech(): 添加 voiceLanguage 参数 | 225, 228, 239 |
| `request.js` | translateAndSpeak(): 更新文档 | 287 |

---

## 验证步骤

### 1. 后端验证

检查 translation-service.js:
```bash
grep -n "voiceLanguage" audio-to-text-backend/translation-service.js
# 输出应包含: 114, 142 等行号
```

检查 api-routes.js:
```bash
grep -n "voiceLanguage" audio-to-text-backend/api-routes.js
# 输出应包含: 122, 138, 165, 169, 259, 260 等行号
```

### 2. 前端验证

检查 request.js:
```bash
grep -n "voiceLanguage" audio-to-text-app/utils/request.js
# 输出应包含: 225, 228, 239, 287 等行号
```

### 3. 功能验证

使用 PowerShell 测试:
```powershell
# 运行 test-tts-cantonese.ps1 脚本
.\test-tts-cantonese.ps1
```

预期结果:
- HTTP 200 响应
- 音频大小: 通常 30KB-100KB (取决于文本长度)
- 输出格式: WAV (粤语语音)

---

## 常见问题

**Q: 为什么要默认设置为粤语 (voiceLanguage=3)?**

A: 这是项目的核心功能 - 将中文文本翻译为粤语并朗读。大多数使用场景都需要粤语输出，所以默认值设为 3。

**Q: 如何生成其他语言的语音?**

A: 在前端调用时传递 voiceLanguage 参数:
- 中文: `textToSpeech("text", 0, 1)`
- 英文: `textToSpeech("text", 0, 2)`
- 粤语: `textToSpeech("text", 0, 3)` 或使用默认

**Q: translateAndSpeak() 是否支持其他语言?**

A: 目前仅用于粤语翻译。后端会自动检测 `language` 参数:
- 如果 language='yue' → 使用 voiceLanguage=3 (粤语)
- 其他语言 → 使用 voiceLanguage=1 (中文)

---

## 下一步测试

- [ ] 在真机上测试粤语朗读效果
- [ ] 对比中文和粤语语音输出
- [ ] 测试不同文本长度的性能
- [ ] 测试网络不稳定情况下的处理

