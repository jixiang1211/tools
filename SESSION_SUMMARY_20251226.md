# 会话总结 - TTS 粤语语音修复

**日期**: 2025-12-26
**任务**: 修复 TTS 生成中文语音而不是粤语语音的问题
**状态**: 🔴 进行中 - 等待确认粤语音色 ID

---

## 会话流程

### 1. 问题描述
- **用户报告**: "文本转语音的时候，产生的结果是中文语音，并不是粤语语音。这要如何调整"
- **症状**: 翻译到粤语后，朗读的仍然是中文

### 2. 初步诊断（失败）
**假设**: 需要添加 `VoiceLanguage` 参数来指定粤语

**修改**:
- 在 `translation-service.js` 添加 `voiceLanguage` 参数
- 在 API 请求中包含 `VoiceLanguage: voiceLanguage` 字段
- 在 API 端点中接收并传递参数

**结果**: ❌ API 返回错误 `"The parameter VoiceLanguage is not recognized"`

### 3. 根本原因分析（成功）
通过查看腾讯云 SDK 的类型定义，发现：

```typescript
// TextToVoiceRequest 的正确参数是 PrimaryLanguage
PrimaryLanguage?: number;  // 1=中文（默认），2=英文
// 没有 VoiceLanguage 参数！
// 没有粤语的 PrimaryLanguage 值！
```

**关键发现**:
- ✅ 正确的参数名是 `PrimaryLanguage`（不是 `VoiceLanguage`）
- ✅ `PrimaryLanguage` 只支持：1=中文，2=英文
- ✅ **腾讯云 TTS 不支持粤语作为语言参数**
- ✅ 粤语需要通过 **VoiceType（音色 ID）** 来实现

### 4. 代码修正（成功）
修改所有文件使用正确的参数名：

**Backend**:
- ✅ `translation-service.js`: 参数 `voiceLanguage` → `primaryLanguage`
- ✅ `api-routes.js`: 更新 `/api/text-to-speech` 端点
- ✅ `api-routes.js`: 更新 `/api/translate-and-speak` 端点

**Frontend**:
- ✅ `request.js`: 更新 `textToSpeech()` 函数签名
- ✅ `request.js`: 更新函数文档

### 5. 测试验证（成功）
- ✅ 后端服务器重启成功
- ✅ API 调用返回 HTTP 200
- ✅ 音频文件正常生成（43KB WAV）
- ✅ 没有参数识别错误

### 6. 遇到的新问题（待解决）
**阻塞点**: 粤语需要通过 VoiceType 来实现，但不知道粤语对应的 VoiceType ID 值

**当前使用**: VoiceType=0（可能是中文音色）
**需要**: 找到粤语对应的 VoiceType ID（可能是 4, 5, 6, 7, 8, 9, 10 等）

---

## 修改的文件详情

### 1. translation-service.js
**修改行**: 114, 139-146

```javascript
// 修改前
async function textToSpeech(text, voiceType = 0, voiceLanguage = 3) {
  // ...
  const payload = JSON.stringify({
    // ...
    VoiceLanguage: voiceLanguage  // ❌ 错误的参数名
  })
}

// 修改后
async function textToSpeech(text, voiceType = 0, primaryLanguage = 1) {
  // ...
  const payload = JSON.stringify({
    // ...
    PrimaryLanguage: primaryLanguage  // ✅ 正确的参数名
  })
}
```

### 2. api-routes.js - /api/text-to-speech 端点
**修改行**: 114-172

- 更新文档注释
- 从请求体提取 `primaryLanguage` 参数
- 传递正确的参数到服务函数
- 更新日志输出

### 3. api-routes.js - /api/translate-and-speak 端点
**修改行**: 256-266

- 移除错误的 voiceLanguage 逻辑
- 使用 primaryLanguage = 1（中文）作为基础
- 添加注释说明粤语需要通过 VoiceType 实现

### 4. request.js
**修改行**: 221-242, 283-295

- `textToSpeech()` 函数签名更新
- `translateAndSpeak()` 函数文档更新
- 移除错误的参数说明

---

## 技术细节

### 腾讯云 TTS API 约束

```
TextToVoice 请求参数:
{
  Text: string,              // 必填
  SessionId: string,         // 必填
  VoiceType: number,         // 音色 ID（0-17，不同ID代表不同语言和性别）
  ModelType: 1,              // 通用模型
  SampleRate: 16000,         // 16kHz
  Codec: 'wav',              // WAV 格式
  PrimaryLanguage: number    // 主语言（1=中文，2=英文）
}

PrimaryLanguage 支持值:
- 1: 中文（默认）
- 2: 英文
- ❌ 没有粤语！

粤语实现方式:
- 通过选择粤语音色的 VoiceType ID
- 不同的 VoiceType 对应不同的语言和性别
- 需要查询腾讯云的音色列表找到粤语ID
```

### API 调用链路

```
前端 (WeChat Mini-app)
  ↓
request.translateAndSpeak(text, 'yue', voiceType)
  ↓
POST /api/translate-and-speak
  ↓
Backend:
  1. 翻译: text(中文) → translatedText(粤语)
  2. TTS: translatedText → 音频 WAV
     - 需要使用粤语音色的 VoiceType ID
     - 当前用的是 voiceType=0（可能是中文）
  ↓
返回: 音频文件（二进制 WAV）
  ↓
前端: 保存为临时文件
  ↓
前端: 使用 wx.createInnerAudioContext() 播放
```

---

## 下次续接步骤

### 第 1 步：确认粤语音色 ID（优先级：最高）

**选项 A**：查询腾讯云文档
- 访问 https://cloud.tencent.com/document/product/1073/92668
- 在音色列表中找粤语音色
- 记录其 VoiceType ID 值

**选项 B**：运行测试脚本
```bash
bash D:/projects/tools-1/test-voicetype-cantonese.sh
```

**选项 C**：在腾讯云控制台测试
- 登录腾讯云 → TTS 服务
- 测试不同的 VoiceType 值（0-17）
- 播放音频找出粤语

### 第 2 步：更新代码
在 `api-routes.js` 的 `/api/translate-and-speak` 端点中：
```javascript
// 添加粤语音色映射
const voiceTypeForCantonese = X  // 替换 X 为实际的粤语 VoiceType ID
const selectedVoiceType = language === 'yue' ? voiceTypeForCantonese : voiceType
```

### 第 3 步：测试验证
- 再次测试 `/api/translate-and-speak` 端点
- 播放生成的音频确认是粤语
- 测试男性/女性两种音色

### 第 4 步：更新文档
- 更新 README 或部署文档
- 记录最终使用的粤语音色 ID
- 更新配置说明

---

## 创建的新文件

| 文件 | 用途 |
|-----|------|
| `QUICK_REFERENCE.md` | 快速参考指南，方便下次恢复工作 |
| `FIX_SUMMARY_TTS_CANTONESE.md` | 详细的修复分析文档 |
| `CANTONESE_VOICETYPE_FIX.md` | 粤语音色问题分析 |
| `SESSION_SUMMARY_20251226.md` | 本文档 |
| `test-voicetype-cantonese.sh` | 粤语音色批量测试脚本 |

---

## 相关资源

- 腾讯云 TTS 官方文档: https://cloud.tencent.com/document/product/1073
- TextToVoice API: https://cloud.tencent.com/document/product/1073/47495
- 音色列表: https://cloud.tencent.com/document/product/1073/92668
- Node.js SDK 类型定义: `/tencentcloud/services/tts/v20190823/tts_models.d.ts`

---

## 当前后端服务器状态

- **启动命令**: `cd D:/projects/tools-1/audio-to-text-backend && PORT=9002 node server-v2.js`
- **监听端口**: 9002
- **代码状态**: 已更新并重启
- **API 状态**: ✅ 正常工作（HTTP 200）

---

## 重要笔记

1. **所有修改都已保存** - 不需要再次修改已完成的部分
2. **后端服务器已重启** - 新代码已生效
3. **API 调用成功** - 音频生成正常，只是需要正确的粤语音色 ID
4. **阻塞点明确** - 只需确认粤语 VoiceType ID 即可解决

---

**Last Updated**: 2025-12-26
**Next Action**: 确认腾讯云粤语音色的 VoiceType ID 值
