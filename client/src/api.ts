import { Question, Feedback, Summary, AnswerResult, UserInfo } from './types';

// 支持环境变量配置 API 地址，生产环境可通过 VITE_API_URL 设置
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export interface StartResponse {
  sessionId: string;
  question: Question;
}

export interface SubmitAnswerResponse {
  result: AnswerResult;
  feedback: Feedback;
  isComplete: boolean;
}

export interface SummaryResponse {
  summary: Summary;
}

/**
 * 开始测试（带自我认知评分）
 */
export async function startTestWithSelfRating(userInfo: UserInfo): Promise<StartResponse> {
  console.log('发送请求到:', `${API_BASE}/start`, '数据:', userInfo);
  
  try {
    const response = await fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userInfo),
    });
    
    console.log('收到响应:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API错误:', errorData);
      throw new Error(errorData.error || `Failed to start test (${response.status})`);
    }
    
    const data = await response.json();
    console.log('API成功返回:', data);
    return data;
  } catch (error: any) {
    console.error('网络错误:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Failed to connect to server'}`);
  }
}

/**
 * 获取下一题
 */
export async function getNextQuestion(sessionId: string): Promise<Question> {
  const response = await fetch(`${API_BASE}/next-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to get next question (${response.status})`);
  }
  
  const data = await response.json();
  
  // 检查是否已完成所有题目
  if (data.isComplete || !data.question) {
    throw new Error(data.message || 'All questions completed');
  }
  
  return data.question;
}

/**
 * 提交答案
 */
export async function submitAnswer(
  sessionId: string,
  answer: any
): Promise<SubmitAnswerResponse> {
  const response = await fetch(`${API_BASE}/submit-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, answer }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit answer');
  }
  
  return response.json();
}

/**
 * 获取总结
 */
export async function getSummary(sessionId: string): Promise<Summary> {
  console.log('📊 Requesting summary for session:', sessionId);
  
  try {
    const response = await fetch(`${API_BASE}/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    
    console.log('📊 Summary response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Summary API error:', errorData);
      throw new Error(errorData.error || `Failed to get summary (${response.status})`);
    }
    
    const data = await response.json();
    console.log('✅ Summary received:', {
      hasOverall: !!data.summary?.overall,
      highlightsCount: data.summary?.highlights?.length || 0,
      blindspotsCount: data.summary?.blindspots?.length || 0,
      hasRadarData: !!data.summary?.radarData,
      resourcesCount: data.summary?.learningResources?.length || 0,
    });
    return data.summary;
  } catch (error: any) {
    console.error('❌ getSummary error:', error);
    throw error;
  }
}

