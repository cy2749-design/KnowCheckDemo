import { v4 as uuidv4 } from 'uuid';
import { SessionData } from '../types/session.js';
import { Question } from '../types/question.js';
import { clearSessionQuestionData } from './questionService.js';

// 内存Session存储（Demo版足够）
const sessions = new Map<string, SessionData>();

/**
 * 创建新Session
 */
export function createSession(): SessionData {
  const sessionId = uuidv4();
  const session: SessionData = {
    sessionId,
    currentQuestionIndex: 0,
    questions: [],
    results: [],
    preloadedQuestion: null,
    startedAt: Date.now(),
  };
  
  sessions.set(sessionId, session);
  // 清理该session的题目生成相关数据（如果有）
  clearSessionQuestionData(sessionId);
  return session;
}

/**
 * 获取Session
 */
export function getSession(sessionId: string): SessionData | null {
  return sessions.get(sessionId) || null;
}

/**
 * 更新Session
 */
export function updateSession(sessionId: string, updates: Partial<SessionData>): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  Object.assign(session, updates);
  sessions.set(sessionId, session);
}

/**
 * 预加载下一题
 */
export async function preloadNextQuestion(
  sessionId: string,
  generateQuestion: () => Promise<Question | null>
): Promise<void> {
  const session = getSession(sessionId);
  if (!session) return;
  
  // 如果已经有预加载的题目，不重复加载
  if (session.preloadedQuestion) {
    console.log('已有预加载题目，跳过');
    return;
  }
  
  // 检查是否还需要预加载（现在有6题，所以检查是否已经有6题）
  if (session.questions.length >= 6) {
    console.log('题目数量已足够，无需预加载');
    return;
  }
  
  // 异步生成题目（不阻塞）
  generateQuestion().then(question => {
    const session = getSession(sessionId);
    if (!session) {
      console.warn('⚠️ 预加载完成时Session已不存在');
      return;
    }
    
    if (question) {
      // 再次检查是否还需要预加载（可能用户已经答完题了）
      if (session.questions.length < 6) {
        updateSession(sessionId, { preloadedQuestion: question });
        console.log(`✅ 预加载成功 - 第 ${session.questions.length + 1} 题，题型: ${question.type}`);
      } else {
        console.log('⚠️ 预加载完成但题目已足够，丢弃预加载题目');
      }
    } else {
      console.error('❌ 预加载生成题目失败: 返回 null');
      // 不设置预加载题目，让下次请求时同步生成
    }
  }).catch(error => {
    console.error('❌ 预加载题目异常:', error);
    console.error('异常堆栈:', error.stack);
  });
}

/**
 * 获取下一题（优先使用预加载）
 */
export function getNextQuestion(sessionId: string): Question | null {
  const session = getSession(sessionId);
  if (!session) return null;
  
  // 如果有预加载的题目，使用它
  if (session.preloadedQuestion) {
    const question = session.preloadedQuestion;
    session.questions.push(question);
    session.preloadedQuestion = null; // 清空预加载
    session.currentQuestionIndex = session.questions.length - 1;
    return question;
  }
  
  // 否则返回当前题目（如果存在）
  return session.questions[session.currentQuestionIndex] || null;
}

/**
 * 清理过期Session（可选，Demo版可省略）
 */
export function cleanupSessions(maxAge: number = 3600000): void {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.startedAt > maxAge) {
      sessions.delete(sessionId);
    }
  }
}

