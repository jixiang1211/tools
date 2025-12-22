@echo off
REM ========================================
REM 音频转文字后端启动脚本
REM ========================================

echo.
echo 🚀 启动音频转文字后端服务...
echo.

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0

REM 进入后端目录
cd /d "%SCRIPT_DIR%"

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 📦 第一次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
)

REM 设置端口为 9001
set PORT=9001

echo.
echo ========================================
echo 📍 后端将运行在：http://localhost:%PORT%
echo 按 Ctrl+C 可以停止服务
echo ========================================
echo.

REM 启动服务
call npm start

pause
