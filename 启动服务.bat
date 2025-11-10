@echo off
chcp 65001 >nul
title AI素养诊断器 - 服务启动

echo ========================================
echo   正在启动服务...
echo ========================================
echo.

REM 检查依赖
if not exist "server\node_modules" (
    echo [错误] 后端依赖未安装，请先运行 start.bat
    pause
    exit /b 1
)

if not exist "client\node_modules" (
    echo [错误] 前端依赖未安装，请先运行 start.bat
    pause
    exit /b 1
)

REM 检查vite是否安装
if not exist "client\node_modules\vite\bin\vite.js" (
    echo [警告] Vite 未找到，正在修复...
    cd client
    cmd /c npm install --ignore-scripts --legacy-peer-deps
    cd ..
    if not exist "client\node_modules\vite\bin\vite.js" (
        echo [错误] Vite 安装失败，请运行 修复并启动.bat
        pause
        exit /b 1
    )
    echo [√] Vite 已修复
    echo.
)

echo 启动前端和后端服务...
echo.
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo.

cmd /c npm run dev

pause

