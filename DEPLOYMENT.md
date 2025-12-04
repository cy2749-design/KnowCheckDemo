# 部署指南

本文档介绍如何将 AI素养诊断器 部署到线上环境，让其他用户可以直接参与测试。

## 📋 部署前准备

### 1. 环境变量配置

在部署前，需要准备以下环境变量：

- `GEMINI_API_KEY`: Gemini API 密钥（必需）
- `SESSION_SECRET`: 会话密钥（建议使用随机字符串）
- `CORS_ORIGIN`: 前端域名（如果前后端分离部署）
- `PORT`: 服务器端口（默认 3000）
- `NODE_ENV`: 环境变量（设置为 `production`）

### 2. 构建项目

```bash
# 安装所有依赖
npm run install:all

# 构建前端
npm run build

# 构建后端
cd server && npm run build
```

## 🚀 部署方案

### 方案一：Railway（推荐，最简单）

Railway 是一个现代化的部署平台，支持自动部署和 HTTPS。

#### 步骤：

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置环境变量**
   - 在项目设置中添加环境变量：
     ```
     GEMINI_API_KEY=你的API密钥
     SESSION_SECRET=随机生成的密钥
     NODE_ENV=production
     PORT=3000
     CORS_ORIGIN=*
     ```

4. **配置构建命令**
   - Railway 会自动检测 `railway.json` 配置文件
   - 或手动设置：
     - Build Command: `npm run install:all && npm run build`
     - Start Command: `cd server && npm start`

5. **部署**
   - Railway 会自动部署
   - 部署完成后会提供一个 `.railway.app` 域名

#### 优点：
- ✅ 免费额度充足
- ✅ 自动 HTTPS
- ✅ 自动部署（Git push 触发）
- ✅ 简单易用

---

### 方案二：Render

Render 提供免费的全栈应用托管。

#### 步骤：

1. **注册 Render 账号**
   - 访问 https://render.com
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库

3. **配置服务**
   - **Name**: `knowcheck-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: 留空

4. **配置环境变量**
   ```
   GEMINI_API_KEY=你的API密钥
   SESSION_SECRET=随机生成的密钥
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=*
   ```

5. **部署前端（静态站点）**
   - 创建新的 "Static Site"
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - 添加环境变量：
     ```
     VITE_API_URL=https://你的后端域名
     ```

#### 优点：
- ✅ 免费套餐可用
- ✅ 自动 HTTPS
- ✅ 支持前后端分离

---

### 方案三：Vercel

Vercel 非常适合前端部署，也支持全栈应用。

#### 步骤：

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库

3. **配置项目**
   - Vercel 会自动检测 `vercel.json` 配置
   - 或手动配置：
     - Framework Preset: `Other`
     - Root Directory: `.`
     - Build Command: `npm run build`
     - Output Directory: `client/dist`

4. **配置环境变量**
   ```
   GEMINI_API_KEY=你的API密钥
   SESSION_SECRET=随机生成的密钥
   NODE_ENV=production
   CORS_ORIGIN=*
   ```

#### 优点：
- ✅ 免费套餐
- ✅ 全球 CDN
- ✅ 自动 HTTPS
- ✅ 极快的部署速度

---

### 方案四：Docker + 云服务器

如果你有自己的服务器（如阿里云、腾讯云、AWS等），可以使用 Docker 部署。

#### 步骤：

1. **构建 Docker 镜像**
   ```bash
   docker build -t knowcheck:latest .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e GEMINI_API_KEY=你的API密钥 \
     -e SESSION_SECRET=随机生成的密钥 \
     -e NODE_ENV=production \
     -e CORS_ORIGIN=* \
     --name knowcheck \
     knowcheck:latest
   ```

3. **配置 Nginx 反向代理（可选）**
   ```nginx
   server {
       listen 80;
       server_name 你的域名;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **配置 SSL（使用 Let's Encrypt）**
   ```bash
   sudo certbot --nginx -d 你的域名
   ```

---

## 🔧 前后端分离部署

如果前后端分别部署，需要：

1. **后端部署**：按照上述任一方案部署后端服务

2. **前端部署**：
   - 修改 `client/src/api.ts` 中的 `API_BASE` 为后端地址
   - 或使用环境变量：
     ```typescript
     const API_BASE = import.meta.env.VITE_API_URL || '/api';
     ```
   - 构建前端：`cd client && npm run build`
   - 将 `client/dist` 部署到静态托管服务（Vercel、Netlify等）

---

## ✅ 部署检查清单

- [ ] 环境变量已配置（GEMINI_API_KEY、SESSION_SECRET等）
- [ ] 前端已构建（`client/dist` 目录存在）
- [ ] 后端已构建（`server/dist` 目录存在）
- [ ] CORS 配置正确（允许前端域名访问）
- [ ] HTTPS 已启用（生产环境必需）
- [ ] 健康检查接口可访问（`/health`）
- [ ] API 接口测试通过

---

## 🐛 常见问题

### 1. CORS 错误

**问题**：前端无法访问后端 API

**解决**：
- 检查 `CORS_ORIGIN` 环境变量是否正确
- 确保后端允许前端域名的请求

### 2. Session 不工作

**问题**：用户会话无法保存

**解决**：
- 检查 `SESSION_SECRET` 是否设置
- 确保 Cookie 的 `secure` 和 `sameSite` 配置正确（HTTPS 环境）

### 3. API 调用失败

**问题**：Gemini API 调用返回错误

**解决**：
- 检查 `GEMINI_API_KEY` 是否正确
- 检查 API 配额是否充足
- 查看后端日志获取详细错误信息

### 4. 静态文件 404

**问题**：前端资源加载失败

**解决**：
- 检查构建输出目录是否正确
- 确保静态文件路径配置正确

---

## 📞 获取帮助

如果遇到部署问题，请：

1. 查看服务器日志
2. 检查环境变量配置
3. 验证 API 密钥有效性
4. 查看本文档的常见问题部分

---

## 🎉 部署完成

部署成功后，你的应用就可以被其他用户访问了！

记得：
- 定期检查服务器日志
- 监控 API 使用量
- 备份重要数据
- 更新依赖包以修复安全漏洞

