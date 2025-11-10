import { Question, QuestionResult } from './question.js';

export interface SessionData {
  sessionId: string;
  currentQuestionIndex: number;
  questions: Question[]; // 已生成的题目列表
  results: QuestionResult[]; // 答题结果
  preloadedQuestion: Question | null; // 预加载的下一题
  startedAt: number;
  completedAt?: number;
}

