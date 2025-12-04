@echo off
echo Testing browser auto-open...
echo Waiting 5 seconds, then opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo Browser should have opened. If not, please open manually: http://localhost:5173
pause



