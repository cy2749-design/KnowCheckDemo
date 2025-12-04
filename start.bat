@echo off
REM Simple startup script - avoid encoding issues
chcp 65001 >nul 2>&1
title AI Literacy Diagnostician

cd /d "%~dp0"

echo ========================================
echo   AI Literacy Diagnostician - Startup
echo ========================================
echo.

echo [Step 1] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

echo [Step 2] Installing dependencies if needed...
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install --legacy-peer-deps
    cd ..
)
echo Dependencies ready!
echo.

echo [Step 3] Starting services...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Waiting 12 seconds for services to start, then opening browser...
echo Press Ctrl+C to stop services
echo.

REM Start browser opener in background
start /b cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:5173"

REM Start services
call npm run dev

pause
