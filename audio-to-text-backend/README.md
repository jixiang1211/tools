# 音频转文字后端服务

这是微信小程序"语音转文字助手"的后端服务，基于 Node.js + Express + 腾讯云 ASR。

## 功能

- 接收小程序上传的音频文件
- 调用腾讯云语音识别 API 进行识别
- 返回识别结果给小程序

## 安装步骤

### 1. 安装依赖

```bash
cd D:\projects\tools-1\audio-to-text-backend
npm install
```

### 2. 配置环境变量

1. 复制 `.env.example` 为 `.env`：
```bash
copy .env.example .env
```

2. 修改 `.env` 文件，填入你的腾讯云配置：
```
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_REGION=ap-beijing
PORT=3000
```

> **获取腾讯云密钥的步骤：**
> 1. 登录 https://console.cloud.tencent.com/
> 2. 点击右上角的"用户名" -> "访问管理"
> 3. 在左菜单选择"访问密钥" -> "API 密钥管理"
> 4. 点击"新建密钥"，获取 SecretId 和 SecretKey
> 5. 填入 `.env` 文件

### 3. 运行服务器

```bash
npm start
```

你会看到：
```
========================================
🚀 音频转文字服务器已启动
📍 监听地址: http://localhost:3000
========================================
```

## API 文档

### 1. 健康检查

```
GET http://localhost:3000/health
```

**响应示例：**
```json
{
  "code": 0,
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. 语音识别（需要腾讯云密钥）

```
POST http://localhost:3000/api/audio-to-text
Content-Type: multipart/form-data

请求体：
  audio: [音频文件]
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "text": "识别出来的文字",
    "confidence": 0.95
  }
}
```

### 3. 模拟识别（用于测试，无需腾讯云密钥）

```
POST http://localhost:3000/api/audio-to-text-mock
Content-Type: multipart/form-data

请求体：
  audio: [音频文件]
```

**响应示例：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "text": "这是一条识别的文字",
    "confidence": 0.87
  }
}
```

## 测试步骤

### 第1步：测试服务器是否运行

```bash
curl http://localhost:3000/health
```

### 第2步：测试模拟识别（推荐先用这个）

使用 Postman 或 curl 测试：

```bash
curl -X POST http://localhost:3000/api/audio-to-text-mock \
  -F "audio=@test.wav"
```

### 第3步：配置腾讯云后测试真实识别

```bash
curl -X POST http://localhost:3000/api/audio-to-text \
  -F "audio=@test.wav"
```

## 在小程序中配置

修改小程序的 `app.js` 中的 `apiBaseUrl`：

```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3000'  // 改成你的服务器地址
}
```

> 如果是本地开发，使用 `http://localhost:3000`
> 如果是部署到服务器，使用你的服务器地址

## 常见问题

### Q: 无法连接到腾讯云怎么办？
A: 检查以下几点：
1. `.env` 文件中的 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY 是否正确
2. 腾讯云账户是否有足够的额度
3. 网络连接是否正常

### Q: 小程序无法连接到后端怎么办？
A: 在微信开发者工具中：
1. 右上角 -> 详情 -> 本地设置
2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 这样就可以访问本地 localhost 了

### Q: 如何在服务器上部署？
A: 可以使用：
- Heroku（免费）
- 阿里云、腾讯云（付费）
- 自己的服务器

部署步骤类似，只需要把 `http://localhost:3000` 改成你的服务器地址。

## 项目结构

```
audio-to-text-backend/
├── server.js                # 主服务器文件
├── package.json             # 项目配置
├── .env.example             # 环境变量示例
├── .env                     # 环境变量（需要自己创建）
├── .gitignore               # git 忽略配置
├── README.md                # 本文件
└── uploads/                 # 上传的文件存储目录
```

## 开发建议

1. **先用模拟端点测试** - 不需要腾讯云密钥
2. **调试时开启 NODE_ENV=development** - 可以看到更详细的错误信息
3. **定期检查服务器日志** - 及时发现问题

## 许可证

ISC
