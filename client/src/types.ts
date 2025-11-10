// 前端类型定义（与后端保持一致）

export type QuestionType = 'match' | 'bucket' | 'mcq' | 'discernment' | 'short_answer';

export interface BaseQuestion {
  type: QuestionType;
  question_text: string;
  short_explanation: string;
  concept: string;
}

export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  options_left: Array<{ id: string; text: string }>;
  options_right: Array<{ id: string; text: string }>;
  answer_key: Array<[string, string]>;
}

export interface BucketQuestion extends BaseQuestion {
  type: 'bucket';
  cards: Array<{ id: string; text: string }>;
  buckets: Array<{ id: string; text: string }>;
  answer_key: Record<string, string>;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Array<{ id: string; text: string }>;
  correct_options: string[];
}

export interface DiscernmentQuestion extends BaseQuestion {
  type: 'discernment';
  statement: string;
  correct_answer: boolean;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  scenario: string;
  key_points: string[];
  expected_length?: string;
}

export type Question = MatchQuestion | BucketQuestion | MCQQuestion | DiscernmentQuestion | ShortAnswerQuestion;

export interface Feedback {
  message: string;
  isCorrect: boolean;
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'article' | 'blog' | 'video' | 'course';
  description?: string;
}

export interface Summary {
  overall: string;
  highlights: string[];
  blindspots: string[];
  suggestions: string[];
  learningResources?: LearningResource[];
  detailedAnalysis?: string;
}

export type AnswerResult = 'correct' | 'partial' | 'incorrect';

