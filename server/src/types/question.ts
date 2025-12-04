// 题目类型定义 - 符合PRD中的JSON契约

export type QuestionType = 'match' | 'bucket' | 'mcq' | 'discernment' | 'short_answer';

export interface BaseQuestion {
  type: QuestionType;
  question_text: string;
  short_explanation: string;
  concept: string; // 概念标签，如 "LLM", "pretraining", "AI_capability_boundary"
}

// 连线题
export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  options_left: Array<{ id: string; text: string }>;
  options_right: Array<{ id: string; text: string }>;
  answer_key: Array<[string, string]>; // [left_id, right_id] 的数组
}

// 分类题
export interface BucketQuestion extends BaseQuestion {
  type: 'bucket';
  cards: Array<{ id: string; text: string }>;
  buckets: Array<{ id: string; text: string }>;
  answer_key: Record<string, string>; // card_id -> bucket_id
}

// 选择题
export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Array<{ id: string; text: string }>;
  correct_options: string[]; // 支持多选
}

// 辨析题
export interface DiscernmentQuestion extends BaseQuestion {
  type: 'discernment';
  statement: string;
  correct_answer: boolean;
}

// 简答题
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  scenario: string; // 实际情境描述
  key_points: string[]; // 答案要点（用于评估）
  expected_length?: string; // 期望答案长度，如"50-100字"
}

export type Question = MatchQuestion | BucketQuestion | MCQQuestion | DiscernmentQuestion | ShortAnswerQuestion;

// 用户答案
export interface UserAnswer {
  questionId: string;
  type: QuestionType;
  // 连线题: { matches: [[left_id, right_id], ...] }
  // 分类题: { assignments: { card_id: bucket_id } }
  // 选择题: { selected: [option_id, ...] }
  // 辨析题: { answer: true/false }
  // 简答题: { answer: string }
  answer: any;
}

// 答题结果
export type AnswerResult = 'correct' | 'partial' | 'incorrect';

export interface QuestionResult {
  questionId: string;
  type: QuestionType;
  concept: string;
  result: AnswerResult;
  userAnswer: any;
  correctAnswer: any;
}

// 即时反馈
export interface Feedback {
  message: string;
  isCorrect: boolean;
}

// 学习资源
export interface LearningResource {
  title: string;
  url: string;
  type: 'article' | 'blog' | 'video' | 'course';
  description?: string;
}

// 雷达图数据
export interface RadarData {
  categories: string[]; // 类别名称，如 ['LLM', 'Prompt Engineering', 'Deep Learning', ...]
  scores: number[]; // 每个类别的得分（0-100）
}

// 最终总结
export interface Summary {
  overall: string; // 总评
  highlights: string[]; // 高光
  blindspots: string[]; // 盲区
  suggestions: string[]; // 建议
  learningResources?: LearningResource[]; // 学习资源推荐
  detailedAnalysis?: string; // 详细分析
  radarData?: RadarData; // 雷达图数据
  selfRating?: number; // 1-5 self-perception rating
  systemLevel?: number; // 1-5 system-calculated level
}

