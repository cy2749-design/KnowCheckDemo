import { Question, QuestionResult } from './question.js';

export interface UserInfo {
  age: number;
  role: 'student' | 'professional' | 'educator' | 'researcher' | 'entrepreneur' | 'other';
  selfRating?: number; // 1-5 self perception for adaptive difficulty
}

export interface SessionData {
  sessionId: string;
  currentQuestionIndex: number;
  questions: Question[]; // 已生成的题目列表
  results: QuestionResult[]; // 答题结果
  preloadedQuestion: Question | null; // 预加载的下一题
  startedAt: number;
  completedAt?: number;
  userInfo?: UserInfo; // 用户信息
  selfRating?: number; // 1-5 self-perception rating
}


