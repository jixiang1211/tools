# 快速参考指南 - TTS 粤语修复进度

**最后更新**: 2025-12-26
**当前状态**: 🔴 阻塞中 - 需要确认粤语音色 ID

---

## 问题简述

用户报告：播放的是中文语音，而不是粤语语音

## 根本原因

腾讯云 TTS API **不支持粤语作为语言参数值**（PrimaryLanguage 只有 1=中文, 2=英文）。
粤语需要通过 **VoiceType（音色 ID）** 来实现。

## 已完成的工作

- ✅ 诊断出正确的 API 参数名：`PrimaryLanguage`（之前错误使用 `VoiceLanguage`）
- ✅ 更新了后端和前端代码
- ✅ 重启后端服务器 - API 调用成功（HTTP 200）
- ✅ 生成音频文件成功（43KB WAV）

## 当前阻塞点

**需要找到粤语对应的 VoiceType ID 值**

可能的 ID 范围：4, 5, 6, 7, 8, 9, 10, 11 等（具体值需确认）

## 下次继续的步骤

### 方法 1：查询腾讯云文档（推荐）
访问：https://cloud.tencent.com/document/product/1073/92668
找出粤语音色的 VoiceType ID，记录下来

### 方法 2：运行测试脚本
```bash
cd D:/projects/tools-1
bash test-voicetype-cantonese.sh
```
这会生成 18 个不同音色的音频文件，逐一播放找出粤语

### 方法 3：在腾讯云控制台测试
登录腾讯云 → TTS 服务 → 文字转语音测试页面
尝试不同的音色参数，找出粤语

## 一旦确认粤语音色 ID

需要更新的代码位置：

**文件**: `D:/projects/tools-1/audio-to-text-backend/api-routes.js`
**位置**: `/api/translate-and-speak` 端点，约第 264 行

```javascript
// 当前代码（错误）
const primaryLanguage = 1  // 使用中文

// 应改为（示例）
const voiceTypeForCantonese = 5  // 粤语音色 ID（需替换为实际值）
const selectedVoiceType = language === 'yue' ? voiceTypeForCantonese : voiceType
const audioBuffer = await translationService.textToSpeech(
  translatedText,
  selectedVoiceType,  // 使用粤语音色
  primaryLanguage     // 主语言参数
)
```

## 文件位置速查

| 文件 | 路径 |
|-----|-----|
| 后端 TTS 服务 | `audio-to-text-backend/translation-service.js` |
| 后端 API 路由 | `audio-to-text-backend/api-routes.js` |
| 前端网络请求 | `audio-to-text-app/utils/request.js` |
| 后端启动脚本 | `audio-to-text-backend/server-v2.js` |

## 后端启动命令

```bash
cd D:/projects/tools-1/audio-to-text-backend
PORT=9002 node server-v2.js
```

## 测试命令

```bash
# 测试 /api/translate-and-speak 端点
curl -X POST http://127.0.0.1:9002/api/translate-and-speak \
  -H "Content-Type: application/json" \
  -d '{"text": "今天天气怎么样", "language": "yue", "voiceType": 0}'

# 输出：WAV 音频文件（二进制）
# 如果成功：HTTP 200 + 音频数据
# 如果失败：HTTP 500 + 错误信息
```

## 相关文档

- `FIX_SUMMARY_TTS_CANTONESE.md` - 详细的修复分析
- `CANTONESE_VOICETYPE_FIX.md` - 粤语音色问题详解
- `TODO.md` - 完整的项目进度

## 关键代码改动

### translation-service.js
```javascript
// 修改了函数签名
async function textToSpeech(text, voiceType = 0, primaryLanguage = 1) {
  // ...
  const payload = JSON.stringify({
    Text: text,
    VoiceType: voiceType,
    PrimaryLanguage: primaryLanguage  // ✅ 使用正确的参数名
  })
}
```

### api-routes.js
```javascript
// /api/translate-and-speak 端点
const { text, language = 'yue', voiceType = 0 } = req.body

// 翻译
const translatedText = await translationService.translateText(text, 'zh', language)

// TTS - 需要添加粤语音色逻辑
const audioBuffer = await translationService.textToSpeech(
  translatedText,
  voiceType,
  1  // primaryLanguage
)
```

---

**注意**: 所有修改都已保存，后端服务器已重启。只需确认粤语音色 ID，然后更新代码即可。
