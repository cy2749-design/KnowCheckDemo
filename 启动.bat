@echo off
REM Simple startup script
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo   Starting Services...
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Waiting 12 seconds, then opening browser...
echo Press Ctrl+C to stop
echo.

REM Start browser opener in background
start /b cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:5173"

REM Start services
call npm start

pause

