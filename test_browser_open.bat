@echo off
echo Testing browser auto-open...
echo.
echo This will open http://localhost:5173 in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo Browser should have opened!
echo.
echo If browser did not open, try manually:
echo 1. Open your browser
echo 2. Go to: http://localhost:5173
echo.
pause



