#!/bin/bash

# 部署脚本 - 用于快速部署到生产环境

echo "🚀 开始部署 AI素养诊断器..."

# 检查环境变量
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  警告: GEMINI_API_KEY 未设置"
    echo "   请在环境变量中设置 GEMINI_API_KEY"
fi

# 安装依赖
echo "📦 安装依赖..."
npm run install:all

# 构建前端
echo "🏗️  构建前端..."
cd client
npm run build
cd ..

# 构建后端
echo "🏗️  构建后端..."
cd server
npm run build
cd ..

echo "✅ 构建完成！"
echo ""
echo "📋 下一步："
echo "   1. 确保已设置所有必需的环境变量"
echo "   2. 启动服务器: cd server && npm start"
echo "   3. 或使用 Docker: docker build -t knowcheck . && docker run -p 3000:3000 knowcheck"

