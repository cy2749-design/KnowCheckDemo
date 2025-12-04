@echo off
REM 设置UTF-8编码
chcp 65001 >nul 2>&1
title AI Literacy Diagnostician - Service Start

echo ========================================
echo   Starting Services...
echo ========================================
echo.

REM 检查依赖
if not exist "server\node_modules" (
    echo [ERROR] Server dependencies not installed. Please run start.bat first.
    pause
    exit /b 1
)

if not exist "client\node_modules" (
    echo [ERROR] Client dependencies not installed. Please run start.bat first.
    pause
    exit /b 1
)

REM 检查vite是否安装
if not exist "client\node_modules\vite\bin\vite.js" (
    echo [WARNING] Vite not found, fixing...
    cd client
    call npm install --ignore-scripts --legacy-peer-deps
    cd ..
    if not exist "client\node_modules\vite\bin\vite.js" (
        echo [ERROR] Vite installation failed. Please run fix script.
        pause
        exit /b 1
    )
    echo [OK] Vite fixed
    echo.
)

echo Starting frontend and backend services...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Press Ctrl+C to stop services
echo.

REM 创建一个临时批处理文件来打开浏览器
echo @echo off > "%TEMP%\open_browser.bat"
echo timeout /t 10 /nobreak ^>nul >> "%TEMP%\open_browser.bat"
echo start http://localhost:5173 >> "%TEMP%\open_browser.bat"
start "" "%TEMP%\open_browser.bat"

REM 启动服务
call npm run dev

REM 清理临时文件
del "%TEMP%\open_browser.bat" >nul 2>&1

pause

