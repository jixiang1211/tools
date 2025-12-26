# 腾讯云 TTS 粤语语音问题分析与解决方案

**问题**: 用户报告 TTS 生成的是中文语音，而不是粤语语音

**根本原因**: 腾讯云 TTS API 不支持粤语作为 `PrimaryLanguage` 参数值。
- `PrimaryLanguage` 只支持：1=中文（默认），2=英文
- 没有粤语选项

**解决方案**: 粤语需要通过 **VoiceType（音色ID）** 来实现

---

## 腾讯云 TTS API 参数说明

### TextToVoice API 请求参数

```javascript
{
  Text: "文本内容",              // 必填
  SessionId: "会话ID",            // 必填
  VoiceType: 0,                  // 音色 ID（0-17，具体值代表不同的音色）
  ModelType: 1,                  // 通用模型
  SampleRate: 16000,             // 16kHz
  Codec: 'wav',                  // WAV 格式
  PrimaryLanguage: 1             // 主语言（1=中文，2=英文）
  // 注意：没有粤语的 PrimaryLanguage 值！
}
```

### VoiceType 音色列表

根据腾讯云官方文档，需要查询[音色列表](https://cloud.tencent.com/document/product/1073/92668)，其中可能包含粤语音色。

常见的粤语音色ID：
- **粤语女性音色**: 需要确认具体 ID（可能是 4, 5, 6, 7 等）
- **粤语男性音色**: 需要确认具体 ID（可能是 8, 9, 10, 11 等）

---

## 当前状态

### ✅ 已修复的部分
1. 更正了参数名：`VoiceLanguage` → `PrimaryLanguage`
2. API 调用现在能成功生成音频了（HTTP 200）
3. 后端代码使用正确的 API 参数

### ❌ 待解决的问题
1. **音色ID不确定**: 不知道粤语音色的具体 VoiceType ID 值
2. **当前用的是默认音色**: VoiceType=0 可能是中文音色

---

## 需要采取的行动

### 1. 确认粤语音色 ID
需要查询腾讯云官方音色列表或通过测试来确认粤语音色的 VoiceType 值。

可能的方法：
- [ ] 查看腾讯云官方文档 - [音色列表文档](https://cloud.tencent.com/document/product/1073/92668)
- [ ] 在腾讯云控制台测试不同的 VoiceType 值
- [ ] 从腾讯云 SDK 中提取音色列表

### 2. 更新代码

一旦确认粤语音色 ID，需要更新：

**backend/api-routes.js `/api/translate-and-speak` 端点**:
```javascript
// 根据语言选择音色
const voiceTypeForCantonese = 5  // 示例：可能是 4, 5, 6, 7 等
const voiceTypeForChinese = 0    // 中文默认音色

const selectedVoiceType = language === 'yue' ? voiceTypeForCantonese : voiceType
const audioBuffer = await translationService.textToSpeech(
  translatedText,
  selectedVoiceType,  // 使用粤语音色
  1                   // 主语言仍为中文
)
```

**frontend/utils/request.js `translateAndSpeak()` 函数**:
```javascript
function translateAndSpeak(text, language = 'yue', voiceType = 0) {
  // ...
  wx.request({
    data: {
      text: text,
      language: language,
      voiceType: voiceType,  // 应该传递粤语音色 ID
      // 或者由后端自动选择
    }
  })
}
```

### 3. 测试验证

使用不同的 VoiceType 值测试，验证哪个是粤语音色：

```bash
# 测试 VoiceType = 4
curl -X POST http://127.0.0.1:9002/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "voiceType": 4, "primaryLanguage": 1}'

# 测试 VoiceType = 5
curl -X POST http://127.0.0.1:9002/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "你好", "voiceType": 5, "primaryLanguage": 1}'

# 等等...
```

---

## 参考信息

- 腾讯云 TTS 官方文档: https://cloud.tencent.com/document/product/1073
- TextToVoice API: https://cloud.tencent.com/document/product/1073/47495
- 音色列表: https://cloud.tencent.com/document/product/1073/92668
- Node.js SDK 类型定义: `/node_modules/tencentcloud-sdk-nodejs/tencentcloud/services/tts/v20190823/tts_models.d.ts`

---

## 技术细节备忘

### 为什么会产生中文语音？
- VoiceType 的默认值 0 或当前值可能对应中文音色
- 腾讯云根据 VoiceType ID 选择具体的音色，不同音色代表不同的：
  - 语言（中文、英文、粤语等）
  - 性别（男性、女性）
  - 风格（新闻、故事等）

### PrimaryLanguage 的作用
- `PrimaryLanguage` 仅用于指定基础语言环境（1=中文，2=英文）
- 不用于选择粤语，粤语完全由 VoiceType 决定

---

**Status**: 需要确认粤语音色 ID
**Priority**: 高（用户已报告问题）
**Blocker**: 不知道粤语对应的 VoiceType ID 值
