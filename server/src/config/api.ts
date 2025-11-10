// Gemini API 配置
// 请在这里填入你的 Gemini API 信息

export const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || 'your api key',
  // 注意：Gemini 2.5 Flash 的模型名称可能是 gemini-2.0-flash-exp 或 gemini-1.5-flash
  // 如果当前 endpoint 不工作，可以尝试：
  // - https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
  // - https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
  endpoint: process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  // 用于生成总结的模型（使用更强大的模型或thinking模式）
  summaryEndpoint: process.env.GEMINI_SUMMARY_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent',
  // 如果thinking模式不可用，使用Pro模型
  proEndpoint: process.env.GEMINI_PRO_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
};

export const APP_CONFIG = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'ai-diagnostician-demo-secret-key',
  totalQuestions: 6, // Demo版固定5-7题，这里设为6（包含简答题）
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

