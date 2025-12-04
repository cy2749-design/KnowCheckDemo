import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { APP_CONFIG } from './config/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 中间件
app.use(cors({
  origin: APP_CONFIG.corsOrigin === '*' ? true : APP_CONFIG.corsOrigin,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: APP_CONFIG.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: APP_CONFIG.isProduction, // 生产环境使用 HTTPS
    httpOnly: true,
    sameSite: APP_CONFIG.isProduction ? 'none' : 'lax',
    maxAge: 3600000, // 1小时
  },
}));

// 路由
app.use('/api', apiRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.5.0' });
});

// 生产环境：提供静态文件服务（如果前端和后端部署在一起）
if (APP_CONFIG.isProduction) {
  try {
    app.use(express.static(path.join(__dirname, '../../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  } catch (error) {
    // 如果静态文件不存在，忽略错误（前后端分离部署时）
    console.log('静态文件服务未启用（前后端分离部署）');
  }
}

// 启动服务器
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`🚀 AI素养诊断器后端服务已启动`);
  console.log(`📍 地址: ${HOST}:${PORT}`);
  console.log(`🌐 健康检查: http://${HOST}:${PORT}/health`);
  console.log(`\n⚠️  请确保在 server/src/config/api.ts 中配置了 Gemini API 信息`);
});

