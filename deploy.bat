@echo off
REM 部署脚本 - Windows 版本

echo 🚀 开始部署 AI素养诊断器...

REM 检查环境变量
if "%GEMINI_API_KEY%"=="" (
    echo ⚠️  警告: GEMINI_API_KEY 未设置
    echo    请在环境变量中设置 GEMINI_API_KEY
)

REM 安装依赖
echo 📦 安装依赖...
call npm run install:all

REM 构建前端
echo 🏗️  构建前端...
cd client
call npm run build
cd ..

REM 构建后端
echo 🏗️  构建后端...
cd server
call npm run build
cd ..

echo ✅ 构建完成！
echo.
echo 📋 下一步：
echo    1. 确保已设置所有必需的环境变量
echo    2. 启动服务器: cd server ^&^& npm start
echo    3. 或使用 Docker: docker build -t knowcheck . ^&^& docker run -p 3000:3000 knowcheck

pause

