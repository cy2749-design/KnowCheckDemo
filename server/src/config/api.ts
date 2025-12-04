// Gemini API 配置
// 请在这里填入你的 Gemini API 信息

export const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || 'AIzaSyDWdq6e45ECel7eG4BJEeBTHEn3jwkU3ho',
  // Gemini 2.0 Flash 模型（统一使用）
  endpoint: process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  // 用于生成总结的模型（也使用 2.0 Flash）
  summaryEndpoint: process.env.GEMINI_SUMMARY_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  // Pro模型端点（已废弃，统一使用 Flash）
  proEndpoint: process.env.GEMINI_PRO_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
};

export const APP_CONFIG = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'ai-diagnostician-demo-secret-key',
  totalQuestions: 6, // Demo版固定5-7题，这里设为6（包含简答题）
  corsOrigin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' 
    ? '*' // 生产环境允许所有来源（可根据需要限制）
    : 'http://localhost:5173'),
  isProduction: process.env.NODE_ENV === 'production',
};

