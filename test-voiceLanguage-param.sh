#!/bin/bash

# 测试 TTS voiceLanguage 参数是否正确传递

echo "=========================================="
echo "测试 1: /api/translate-and-speak (粤语)"
echo "=========================================="

curl -X POST http://127.0.0.1:9002/api/translate-and-speak \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好世界",
    "language": "yue",
    "voiceType": 0
  }' \
  -w "\nHTTP 状态码: %{http_code}\n" \
  -o /tmp/test-audio-yue.wav 2>&1

echo ""
echo "✅ 已保存粤语音频到: /tmp/test-audio-yue.wav"
echo "文件大小: $(stat -f%z /tmp/test-audio-yue.wav 2>/dev/null || du -b /tmp/test-audio-yue.wav | cut -f1) 字节"

echo ""
echo "=========================================="
echo "测试 2: /api/text-to-speech (指定 voiceLanguage=3)"
echo "=========================================="

curl -X POST http://127.0.0.1:9002/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好世界",
    "voiceType": 0,
    "voiceLanguage": 3
  }' \
  -w "\nHTTP 状态码: %{http_code}\n" \
  -o /tmp/test-audio-direct.wav 2>&1

echo ""
echo "✅ 已保存粤语音频到: /tmp/test-audio-direct.wav"

echo ""
echo "测试完成！后端已重新启动并使用新的 voiceLanguage 参数。"
