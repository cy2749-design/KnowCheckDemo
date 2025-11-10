# AI素养诊断器 v1.5 (Demo版)

面向AI基础用户的3-5分钟轻量小游戏式自测工具。

## 技术栈

- **前端**: React + TypeScript + TailwindCSS + Vite
- **后端**: Node.js + Express + TypeScript
- **拖拽交互**: react-dnd

## 🚀 一键启动

### Windows 用户

双击运行 `start.bat` 文件，或在命令行执行：

```bash
start.bat
```

### Mac/Linux 用户

```bash
chmod +x start.sh
./start.sh
```

### 或使用 npm 命令

```bash
# 首次运行需要安装依赖
npm run install:all

# 之后直接启动
npm start
# 或
npm run dev
```

## 📋 配置说明

### Gemini API 配置

API Key 已配置在 `server/src/config/api.ts` 中。如需修改：

**方式一：直接修改代码**

编辑 `server/src/config/api.ts`，修改 `apiKey` 字段。

**方式二：使用环境变量（推荐）**

创建 `server/.env` 文件：

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
PORT=3000
SESSION_SECRET=your_session_secret_here
CORS_ORIGIN=http://localhost:5173
```

## 🌐 访问应用

启动成功后，打开浏览器访问：

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

## ⚠️ 常见问题

### 前端依赖安装失败（patch-package 错误）

如果遇到 `patch-package` 相关错误：

**解决方案**：双击运行 `修复并启动.bat`
- 此脚本使用 `--ignore-scripts` 跳过有问题的 postinstall 脚本
- 会自动修复并启动服务

### 连接被拒绝 (ERR_CONNECTION_REFUSED)

如果看到"连接被拒绝"错误，说明服务没有启动：

1. **首次运行**：双击 `start.bat`（会自动安装依赖并启动）
2. **修复并启动**：双击 `修复并启动.bat`（修复问题并启动）
3. **后续运行**：双击 `启动服务.bat`（直接启动服务）

详细故障排除请查看：`TROUBLESHOOTING.md`

## 项目结构

```
├── client/          # 前端React应用
├── server/          # 后端Express服务
└── README.md
```

## API接口说明

后端已预留标准化的LLM调用接口，你只需在 `server/src/services/llmService.ts` 中实现 `callGeminiAPI` 方法即可。

