import { Question, Feedback, Summary, AnswerResult } from './types';

const API_BASE = '/api';

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
 * 开始测试
 */
export async function startTest(): Promise<StartResponse> {
  const response = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Failed to start test (${response.status})`);
  }
  
  return response.json();
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
  const response = await fetch(`${API_BASE}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get summary');
  }
  
  const data = await response.json();
  return data.summary;
}

