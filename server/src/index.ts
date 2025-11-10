import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import apiRoutes from './routes/api.js';
import { APP_CONFIG } from './config/api.js';

const app = express();

// 中间件
app.use(cors({
  origin: APP_CONFIG.corsOrigin,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: APP_CONFIG.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Demo版，HTTP即可
    maxAge: 3600000, // 1小时
  },
}));

// 路由
app.use('/api', apiRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.5.0' });
});

// 启动服务器
const PORT = APP_CONFIG.port;
app.listen(PORT, () => {
  console.log(`🚀 AI素养诊断器后端服务已启动`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/health`);
  console.log(`\n⚠️  请确保在 server/src/config/api.ts 中配置了 Gemini API 信息`);
});

