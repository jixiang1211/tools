# 测试 TTS 粤语功能
$body = @{
    text = "你好，我是音频转文字助手"
    language = "yue"
} | ConvertTo-Json

Write-Host "📥 发送请求到 /api/translate-and-speak..."
Write-Host "   文本: 你好，我是音频转文字助手"
Write-Host "   目标语言: 粤语"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:9002/api/translate-and-speak" `
      -Method POST `
      -Headers @{"Content-Type" = "application/json"} `
      -Body $body `
      -SkipHttpErrorCheck

    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 翻译并朗读成功"
        Write-Host "   响应大小: $($response.Content.Length) 字节"
        Write-Host "   Content-Type: $($response.Headers['Content-Type'])"
        Write-Host "   输出格式: WAV 音频 (粤语)"

        # 保存音频文件用于测试
        $audioPath = "D:/projects/tools-1/test-cantonese-output.wav"
        [System.IO.File]::WriteAllBytes($audioPath, $response.Content)
        Write-Host "   已保存到: $audioPath"
    } else {
        Write-Host "❌ 请求失败: HTTP $($response.StatusCode)"
        Write-Host "   错误响应:"
        Write-Host $response.Content
    }
} catch {
    Write-Host "❌ 网络错误: $_"
    Write-Host "   请确保后端服务器运行在 http://127.0.0.1:9002"
}
