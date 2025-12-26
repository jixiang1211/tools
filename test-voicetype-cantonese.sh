#!/bin/bash

# 测试不同的 VoiceType 找到粤语音色

echo "=========================================="
echo "腾讯云 TTS VoiceType 粤语音色探测"
echo "=========================================="
echo ""

# 测试文本
TEXT="你好"

# 测试 VoiceType 值范围
for VOICE_TYPE in {0..17}; do
  echo "测试 VoiceType=$VOICE_TYPE..."

  RESPONSE=$(curl -s -X POST http://127.0.0.1:9002/api/text-to-speech \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$TEXT\",
      \"voiceType\": $VOICE_TYPE,
      \"primaryLanguage\": 1
    }" \
    -w "\nSTATUS:%{http_code}" \
    -o "/tmp/test-voice-$VOICE_TYPE.wav")

  STATUS=$(echo "$RESPONSE" | grep "STATUS:" | cut -d: -f2)

  if [ "$STATUS" = "200" ]; then
    FILE_SIZE=$(stat -f%z "/tmp/test-voice-$VOICE_TYPE.wav" 2>/dev/null || stat -c%s "/tmp/test-voice-$VOICE_TYPE.wav" 2>/dev/null || echo "?")
    echo "  ✅ VoiceType=$VOICE_TYPE 成功，文件大小：$FILE_SIZE 字节"
  else
    echo "  ❌ VoiceType=$VOICE_TYPE 失败 (HTTP $STATUS)"
  fi

  # 等待避免限流
  sleep 1
done

echo ""
echo "=========================================="
echo "测试完成！"
echo "生成的音频文件位于: /tmp/test-voice-*.wav"
echo "请使用音频播放器播放这些文件，找出粤语音色。"
echo "=========================================="
