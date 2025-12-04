#!/bin/bash

echo "========================================"
echo "  AI素养诊断器 - 一键启动脚本"
echo "========================================"
echo ""

echo "[1/3] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装根目录依赖..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "正在安装后端依赖..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "正在安装前端依赖..."
    cd client && npm install && cd ..
fi

echo ""
echo "[2/3] 检查配置..."
if [ -z "$GEMINI_API_KEY" ]; then
    echo "警告: 未设置 GEMINI_API_KEY 环境变量"
    echo "将使用 server/src/config/api.ts 中的配置"
fi

echo ""
echo "[3/3] 启动服务..."
echo ""
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

npm run dev



