import { GEMINI_CONFIG } from '../config/api.js';
import { Question, QuestionType } from '../types/question.js';

/**
 * LLM服务接口 - 标准化抽象层
 * 你需要在这里实现 callGeminiAPI 方法来调用 Gemini 2.5 Flash
 */

export interface LLMRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  useGrounding?: boolean; // 是否使用检索功能
  useThinking?: boolean; // 是否使用thinking模式
  model?: 'flash' | 'pro' | 'thinking'; // 指定使用的模型
}

export interface LLMResponse {
  content: string;
  error?: string;
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
    };
  }>;
}

/**
 * 调用 Gemini API
 * TODO: 请根据 Gemini 2.5 Flash 的实际API格式实现此方法
 * 
 * 参考格式（需要根据实际API调整）:
 * POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY
 * Body: {
 *   "contents": [{
 *     "parts": [{"text": "你的提示词"}]
 *   }],
 *   "generationConfig": {
 *     "temperature": 0.7,
 *     "maxOutputTokens": 2048
 *   }
 * }
 */
export async function callGeminiAPI(request: LLMRequest, retryCount: number = 0): Promise<LLMResponse> {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000; // 1秒

  try {
    // 检查 API Key
    if (!GEMINI_CONFIG.apiKey || GEMINI_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
      return {
        content: '',
        error: 'API Key not configured. Please set GEMINI_API_KEY in server/src/config/api.ts'
      };
    }

    // 统一使用 2.0 Flash 模型
    let endpoint = GEMINI_CONFIG.endpoint;
    // 忽略 model 参数，统一使用 Flash
    if (request.model === 'thinking' || request.useThinking || request.model === 'pro') {
      console.log('⚠️ Model parameter ignored, using 2.0 Flash endpoint.');
    }

    const url = `${endpoint}?key=${GEMINI_CONFIG.apiKey}`;
    
    if (retryCount === 0) {
      console.log('调用 Gemini API:', url.substring(0, 100) + '...');
    } else {
      console.log(`重试调用 Gemini API (第 ${retryCount + 1} 次)...`);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: request.prompt }]
        }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // 429 错误：配额超限，不重试
      if (response.status === 429) {
        console.error('❌ Gemini API quota exceeded (429)');
        console.error('Error details:', errorData);
        return {
          content: '',
          error: `API quota exceeded (429): ${errorData.error?.message || 'Request too frequent or quota exhausted. Please check API Key quota settings or try again later.'}`
        };
      }
      
      // 400/401/403 错误：API Key问题
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        console.error(`❌ Gemini API authentication error (${response.status})`);
        console.error('Error details:', errorData);
        return {
          content: '',
          error: `API authentication failed (${response.status}): ${errorData.error?.message || 'Invalid API Key or insufficient permissions. Please check your API Key configuration.'}`
        };
      }

      // 其他错误：如果是临时错误且未达到最大重试次数，则重试
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.warn(`⚠️ API返回 ${response.status}，${RETRY_DELAY}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return callGeminiAPI(request, retryCount + 1);
      }

      console.error('❌ Gemini API error:', response.status);
      console.error('Error details:', errorText.substring(0, 500));
      return {
        content: '',
        error: `API request failed: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }

    const data: any = await response.json();
    
    // 检查finishReason
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Response hit MAX_TOKENS limit. Content may be truncated.');
      // 即使达到MAX_TOKENS，也尝试提取已有内容
    }
    
    // 解析Gemini响应
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!content) {
      console.error('❌ API response format error: no text content found');
      console.error('Response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
      console.error('Finish reason:', finishReason);
      console.error('Usage metadata:', data.usageMetadata);
      
      // 如果是MAX_TOKENS且没有内容，建议增加token限制
      if (finishReason === 'MAX_TOKENS') {
        return {
          content: '',
          error: 'Response hit MAX_TOKENS limit. Please increase maxTokens or simplify the prompt.'
        };
      }
      
      return {
        content: '',
        error: 'API response format error, no text content found. Response: ' + JSON.stringify(data).substring(0, 200)
      };
    }
    
    // 如果达到MAX_TOKENS但仍有内容，记录警告
    if (finishReason === 'MAX_TOKENS') {
      console.warn(`⚠️ Content truncated at MAX_TOKENS. Received ${content.length} characters.`);
    }

    if (retryCount > 0) {
      console.log(`✅ 重试成功，返回内容长度: ${content.length}`);
    } else {
      console.log('API调用成功，返回内容长度:', content.length);
    }
    return { content };
  } catch (error: any) {
    // 网络错误：如果是临时错误且未达到最大重试次数，则重试
    if (retryCount < MAX_RETRIES && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.warn(`⚠️ 网络错误，${RETRY_DELAY}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return callGeminiAPI(request, retryCount + 1);
    }

    console.error('❌ Error calling API:', error);
    return {
      content: '',
      error: `Error calling API: ${error.message}`
    };
  }
}

/**
 * 调用 Gemini API（带检索功能 - Grounding with Google Search）
 */
export async function callGeminiAPIWithGrounding(request: LLMRequest, retryCount: number = 0): Promise<LLMResponse> {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;

  try {
    if (!GEMINI_CONFIG.apiKey || GEMINI_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
      return {
        content: '',
        error: 'API Key 未配置'
      };
    }

    const url = `${GEMINI_CONFIG.endpoint}?key=${GEMINI_CONFIG.apiKey}`;
    
    if (retryCount === 0) {
      console.log('调用 Gemini API（带检索功能）:', url.substring(0, 100) + '...');
    } else {
      console.log(`重试调用 Gemini API (第 ${retryCount + 1} 次)...`);
    }
    
    // 构建请求体，包含 Grounding 配置
    const requestBody: any = {
      contents: [{
        parts: [{ text: request.prompt }]
      }],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
      },
      // 启用 Google Search 检索（使用正确的字段名）
      tools: [{
        googleSearch: {}
      }]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      if (response.status === 429) {
        console.error('❌ Gemini API 配额超限 (429)');
        return {
          content: '',
          error: `API配额超限 (429): ${errorData.error?.message || '请求过于频繁或配额已用完'}`
        };
      }

      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        console.warn(`⚠️ API返回 ${response.status}，${RETRY_DELAY}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return callGeminiAPIWithGrounding(request, retryCount + 1);
      }

      console.error('❌ Gemini API error:', response.status);
      console.error('Error details:', errorText.substring(0, 500));
      return {
        content: '',
        error: `API request failed: ${response.status} - ${errorText.substring(0, 200)}`
      };
    }

    const data: any = await response.json();
    
    // 解析Gemini响应（可能包含检索到的信息）
    // 提取grounding chunks中的真实URL
    let groundingChunks: Array<{ web?: { uri?: string; title?: string } }> = [];
    if (data.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      groundingChunks = data.candidates[0].groundingMetadata.groundingChunks;
      console.log(`📄 检索到 ${groundingChunks.length} 个相关信息片段`);
      
      // 打印前几个真实URL用于调试
      const realUrls = groundingChunks
        .filter(chunk => chunk.web?.uri)
        .map(chunk => chunk.web!.uri)
        .slice(0, 3);
      if (realUrls.length > 0) {
        console.log('🔗 检索到的真实URL示例:', realUrls);
      }
    }
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!content) {
      console.error('API响应格式异常:', JSON.stringify(data).substring(0, 500));
      return {
        content: '',
        error: 'API响应格式异常，未找到文本内容'
      };
    }

    if (retryCount > 0) {
      console.log(`✅ 重试成功，返回内容长度: ${content.length}`);
    } else {
      console.log('✅ API调用成功（带检索），返回内容长度:', content.length);
    }
    return { 
      content,
      groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined
    };
  } catch (error: any) {
    if (retryCount < MAX_RETRIES && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.warn(`⚠️ 网络错误，${RETRY_DELAY}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return callGeminiAPIWithGrounding(request, retryCount + 1);
    }

    console.error('❌ Error calling API:', error);
    return {
      content: '',
      error: `Error calling API: ${error.message}`
    };
  }
}

/**
 * 解析LLM返回的JSON（带容错）
 */
export function parseLLMJSON<T>(text: string): T | null {
  try {
    // 移除可能的BOM和前后空白
    let cleanedText = text.trim();
    
    // 如果开头有非JSON字符（如"好的，我明白了"），尝试找到第一个 {
    const firstBrace = cleanedText.indexOf('{');
    if (firstBrace > 0) {
      console.log(`⚠️ 检测到JSON前有额外文字（${firstBrace}个字符），从第 ${firstBrace + 1} 个字符开始解析`);
      cleanedText = cleanedText.substring(firstBrace);
    }
    
    // 尝试提取JSON代码块
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }
    
    // 尝试提取JSON对象（更宽松的匹配）
    const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]) as T;
      } catch (e) {
        console.warn('提取的JSON对象解析失败，尝试直接解析整个文本');
      }
    }
    
    // 尝试直接解析
    return JSON.parse(cleanedText) as T;
  } catch (error) {
    console.error('JSON解析失败:', error);
    console.error('原始内容前500字符:', text.substring(0, 500));
    
    // 最后尝试：查找所有可能的JSON对象
    const jsonMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed && typeof parsed === 'object') {
            console.log('✅ 从多个JSON候选中成功解析一个');
            return parsed as T;
          }
        } catch {
          // 继续尝试下一个
        }
      }
    }
    
    return null;
  }
}

