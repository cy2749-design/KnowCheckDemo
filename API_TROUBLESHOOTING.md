# API 问题排查指南

## 错误：Failed to generate question: LLM did not return a valid question

### 可能的原因

1. **API Key 无效或过期**
   - 检查 `server/src/config/api.ts` 中的 API Key
   - 确保 API Key 有效且未过期
   - 获取新的 API Key: https://aistudio.google.com/apikey

2. **API 配额超限**
   - 检查 Google Cloud Console 中的配额使用情况
   - 可能需要等待配额重置或升级配额

3. **API 端点不可用**
   - 已自动降级到 `gemini-2.0-flash-exp`
   - 如果仍然失败，可能需要检查网络连接

4. **网络问题**
   - 检查是否能访问 Google API
   - 检查防火墙设置

### 排查步骤

1. **查看后端日志**
   - 查看运行后端的终端窗口
   - 查找以 `❌` 开头的错误信息
   - 查看具体的错误状态码和消息

2. **检查 API Key**
   ```bash
   # 检查配置文件
   cat server/src/config/api.ts
   ```

3. **测试 API Key**
   - 访问 https://aistudio.google.com/apikey
   - 确认 API Key 状态
   - 如有需要，创建新的 API Key

4. **检查网络连接**
   ```bash
   # 测试是否能访问 Google API
   curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY
   ```

### 临时解决方案

如果 API 完全不可用，系统会自动使用降级题目（fallback questions），但功能会受限。

### 获取新的 API Key

1. 访问 https://aistudio.google.com/apikey
2. 登录 Google 账号
3. 创建新的 API Key
4. 更新 `server/src/config/api.ts` 中的 `apiKey` 字段
5. 重启服务



