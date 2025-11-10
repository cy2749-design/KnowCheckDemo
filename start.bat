@echo off
chcp 65001 >nul
echo ========================================
echo   AI素养诊断器 - 一键启动脚本
echo ========================================
echo.

echo [步骤 1/4] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js 已安装
node --version
echo.

echo [步骤 2/4] 安装依赖（首次运行需要几分钟）...
if not exist "node_modules" (
    echo 正在安装根目录依赖...
    cmd /c npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo 正在安装后端依赖...
    cd server
    cmd /c npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

if not exist "client\node_modules" (
    echo 正在安装前端依赖...
    cd client
    echo 先安装必要的依赖...
    cmd /c npm install patch-package @esbuild/win32-x64 --save-dev --save-optional --legacy-peer-deps
    echo 安装所有依赖...
    cmd /c npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo 尝试标准安装...
        cmd /c npm install
        if %errorlevel% neq 0 (
            echo [错误] 前端依赖安装失败
            cd ..
            pause
            exit /b 1
        )
    )
    cd ..
)
echo 依赖安装完成！
echo.

echo [步骤 3/4] 检查配置...
if "%GEMINI_API_KEY%"=="" (
    echo 提示: 未设置 GEMINI_API_KEY 环境变量
    echo 将使用 server/src/config/api.ts 中的配置
)
echo 配置检查完成
echo.

echo [步骤 4/4] 启动服务...
echo.
echo ========================================
echo   服务启动中，请稍候...
echo ========================================
echo.
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3000
echo.
echo 等待服务启动后，将自动打开浏览器...
echo 按 Ctrl+C 停止服务
echo.

REM 延迟8秒后自动打开浏览器（给服务启动时间）
start "" cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:5173"

REM 启动服务（使用 cmd 执行，避免 PowerShell 执行策略问题）
cmd /c npm run dev

pause

